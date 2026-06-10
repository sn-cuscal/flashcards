mock_provider "aws" {
  mock_resource "aws_iam_role" {
    defaults = {
      arn = "arn:aws:iam::123456789012:role/mock-role"
    }
  }

  mock_resource "aws_cloudwatch_log_group" {
    defaults = {
      arn = "arn:aws:logs:ap-southeast-2:123456789012:log-group:mock"
    }
  }

  mock_resource "aws_apigatewayv2_api" {
    defaults = {
      execution_arn = "arn:aws:execute-api:ap-southeast-2:123456789012:mockapi"
    }
  }

  mock_resource "aws_lambda_function" {
    defaults = {
      arn        = "arn:aws:lambda:ap-southeast-2:123456789012:function:mock"
      invoke_arn = "arn:aws:apigateway:ap-southeast-2:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-2:123456789012:function:mock/invocations"
    }
  }
}

run "defaults" {
  command = plan

  assert {
    condition     = var.tags["Owner"] == "Scott N"
    error_message = "every AWS resource must carry Owner = Scott N via default_tags"
  }

  assert {
    condition     = aws_dynamodb_table.games.billing_mode == "PAY_PER_REQUEST"
    error_message = "table must be on-demand"
  }

  assert {
    condition     = one(aws_dynamodb_table.games.ttl).attribute_name == "expiresAtEpochSeconds" && one(aws_dynamodb_table.games.ttl).enabled
    error_message = "TTL must be enabled on expiresAtEpochSeconds"
  }

  assert {
    condition     = aws_dynamodb_table.games.hash_key == "pk" && aws_dynamodb_table.games.range_key == "sk"
    error_message = "table keys must be pk/sk"
  }

  assert {
    condition     = aws_lambda_function.ws_handler.runtime == "nodejs22.x"
    error_message = "lambda must run nodejs22.x"
  }

  assert {
    condition     = aws_lambda_function.ws_handler.handler == "backend/src/handler.handler"
    error_message = "handler must match the zip layout"
  }

  assert {
    condition     = one(aws_lambda_function.ws_handler.environment).variables["TABLE_NAME"] == "flashcards-live-games"
    error_message = "lambda must point at the games table"
  }

  assert {
    condition     = aws_apigatewayv2_api.ws.protocol_type == "WEBSOCKET"
    error_message = "api must be a WebSocket API"
  }

  assert {
    condition     = aws_apigatewayv2_api.ws.route_selection_expression == "$request.body.action"
    error_message = "actions are routed on the message action field"
  }

  assert {
    condition = (
      aws_apigatewayv2_route.connect.route_key == "$connect" &&
      aws_apigatewayv2_route.disconnect.route_key == "$disconnect" &&
      aws_apigatewayv2_route.default_route.route_key == "$default"
    )
    error_message = "all three WebSocket routes must exist"
  }

  assert {
    condition     = aws_apigatewayv2_stage.prod.name == "prod" && aws_apigatewayv2_stage.prod.auto_deploy
    error_message = "stage must be prod with auto deploy"
  }

  assert {
    condition     = one(aws_apigatewayv2_stage.prod.default_route_settings).throttling_rate_limit == 50
    error_message = "stage must be throttled"
  }

  assert {
    condition     = length(aws_acm_certificate.ws) == 0 && length(aws_apigatewayv2_domain_name.ws) == 0
    error_message = "no domain resources without custom_domain"
  }
}

run "custom_domain_creates_cert_only" {
  command = plan

  variables {
    custom_domain = "play.example.com"
  }

  assert {
    condition     = length(aws_acm_certificate.ws) == 1 && aws_acm_certificate.ws[0].domain_name == "play.example.com"
    error_message = "setting custom_domain must create the certificate"
  }

  assert {
    condition     = aws_acm_certificate.ws[0].validation_method == "DNS"
    error_message = "certificate must validate via DNS (Cloudflare records)"
  }

  assert {
    condition     = length(aws_apigatewayv2_domain_name.ws) == 0 && length(aws_apigatewayv2_api_mapping.ws) == 0
    error_message = "domain + mapping must wait for custom_domain_ready"
  }
}

run "custom_domain_ready_creates_domain" {
  command = plan

  variables {
    custom_domain       = "play.example.com"
    custom_domain_ready = true
  }

  assert {
    condition     = length(aws_apigatewayv2_domain_name.ws) == 1 && length(aws_apigatewayv2_api_mapping.ws) == 1
    error_message = "ready flag must create the domain and api mapping"
  }

  assert {
    condition     = one(aws_apigatewayv2_domain_name.ws[0].domain_name_configuration).endpoint_type == "REGIONAL"
    error_message = "custom domain must be regional"
  }

  assert {
    condition     = one(aws_apigatewayv2_domain_name.ws[0].domain_name_configuration).security_policy == "TLS_1_2"
    error_message = "custom domain must require TLS 1.2"
  }

  assert {
    condition     = output.custom_wss_url == "wss://play.example.com"
    error_message = "custom wss url must use the custom domain"
  }
}

run "ready_flag_requires_domain" {
  command = plan

  variables {
    custom_domain_ready = true
  }

  expect_failures = [var.custom_domain_ready]
}

run "apply_wires_outputs" {
  command = apply

  assert {
    condition     = startswith(output.wss_url, "wss://") && strcontains(output.wss_url, "execute-api.ap-southeast-2.amazonaws.com/prod")
    error_message = "wss_url must be the execute-api endpoint for the prod stage"
  }

  assert {
    condition     = strcontains(one(aws_lambda_function.ws_handler.environment).variables["WS_MANAGEMENT_ENDPOINT"], "execute-api.ap-southeast-2.amazonaws.com/prod")
    error_message = "lambda must post back through the execute-api management endpoint"
  }

  assert {
    condition     = output.acm_validation_records == [] && output.cloudflare_app_record == null
    error_message = "domain outputs must be empty without a custom domain"
  }
}
