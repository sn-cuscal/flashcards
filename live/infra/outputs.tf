output "wss_url" {
  description = "WebSocket endpoint to set as wsUrl in apps/play/config.js"
  value       = "wss://${aws_apigatewayv2_api.ws.id}.execute-api.${var.region}.amazonaws.com/${aws_apigatewayv2_stage.prod.name}"
}

output "acm_validation_records" {
  description = "Add these CNAMEs in Cloudflare (DNS only, not proxied) to validate the certificate, then set custom_domain_ready = true and apply again"
  value = var.custom_domain != "" ? [
    for o in aws_acm_certificate.ws[0].domain_validation_options : {
      name  = o.resource_record_name
      type  = o.resource_record_type
      value = o.resource_record_value
    }
  ] : []
}

output "cloudflare_app_record" {
  description = "Cloudflare record pointing the custom domain at API Gateway (use DNS only, not proxied)"
  value = var.custom_domain_ready ? {
    name  = var.custom_domain
    type  = "CNAME"
    value = aws_apigatewayv2_domain_name.ws[0].domain_name_configuration[0].target_domain_name
  } : null
}

output "custom_wss_url" {
  description = "WebSocket endpoint on the custom domain once the Cloudflare record is live"
  value       = var.custom_domain_ready ? "wss://${var.custom_domain}" : null
}

output "dynamodb_table_name" {
  description = "Game state table"
  value       = aws_dynamodb_table.games.name
}

output "lambda_function_name" {
  description = "WebSocket handler function"
  value       = aws_lambda_function.ws_handler.function_name
}
