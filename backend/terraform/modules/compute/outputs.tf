output "instance_public_ip" {
  description = "Public IP of the created EC2 instance"
  value       = aws_instance.app_server.public_ip
}

output "instance_id" {
  description = "ID of the created EC2 instance"
  value       = aws_instance.app_server.id
}
