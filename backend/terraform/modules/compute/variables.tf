variable "project_name" {
  type = string
}

variable "ami_id" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t3.micro"
}

variable "key_name" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "allowed_ingress_ports" {
  description = "List of ports to open for inbound traffic"
  type        = list(number)
  default     = [22, 80]
}
