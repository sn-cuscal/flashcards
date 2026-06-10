data "archive_file" "handler" {
  type        = "zip"
  output_path = "${path.module}/.build/handler.zip"

  source {
    filename = "backend/src/handler.mjs"
    content  = file("${path.module}/../backend/src/handler.mjs")
  }

  source {
    filename = "backend/src/actions.mjs"
    content  = file("${path.module}/../backend/src/actions.mjs")
  }

  source {
    filename = "backend/src/engine.mjs"
    content  = file("${path.module}/../backend/src/engine.mjs")
  }

  source {
    filename = "backend/src/store-dynamo.mjs"
    content  = file("${path.module}/../backend/src/store-dynamo.mjs")
  }

  source {
    filename = "backend/src/send-apigw.mjs"
    content  = file("${path.module}/../backend/src/send-apigw.mjs")
  }

  source {
    filename = "shared/scoring.mjs"
    content  = file("${path.module}/../shared/scoring.mjs")
  }
}

resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.name_prefix}-ws-handler"
  retention_in_days = var.log_retention_days
}

resource "aws_lambda_function" "ws_handler" {
  function_name    = "${var.name_prefix}-ws-handler"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  handler          = "backend/src/handler.handler"
  architectures    = ["arm64"]
  filename         = data.archive_file.handler.output_path
  source_code_hash = data.archive_file.handler.output_base64sha256
  memory_size      = 256
  timeout          = 10

  environment {
    variables = {
      TABLE_NAME             = aws_dynamodb_table.games.name
      WS_MANAGEMENT_ENDPOINT = "https://${aws_apigatewayv2_api.ws.id}.execute-api.${var.region}.amazonaws.com/${local.stage_name}"
    }
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}
