resource "aws_acm_certificate" "ws" {
  count = var.custom_domain != "" ? 1 : 0

  domain_name       = var.custom_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_apigatewayv2_domain_name" "ws" {
  count = var.custom_domain_ready ? 1 : 0

  domain_name = var.custom_domain

  domain_name_configuration {
    certificate_arn = aws_acm_certificate.ws[0].arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "ws" {
  count = var.custom_domain_ready ? 1 : 0

  api_id      = aws_apigatewayv2_api.ws.id
  domain_name = aws_apigatewayv2_domain_name.ws[0].id
  stage       = aws_apigatewayv2_stage.prod.id
}
