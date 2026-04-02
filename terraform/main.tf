provider "aws" {
  region = "ap-southeast-1" # Singapore region (closest to Dhaka)
}

resource "aws_instance" "devops_server" {
  ami           = "ami-0df7a207adb9748c7" # Ubuntu 24.04 LTS
  instance_type = "t3.medium"
  key_name      = "ijaz-ssh-key"

  tags = {
    Name = "Qtec-DevOps-Showcase"
  }

  # Security Group for our custom ports
  vpc_security_group_ids = [aws_security_group.qtec_sg.id]
}

resource "aws_security_group" "qtec_sg" {
  name        = "qtec-security-group"
  description = "Allow DevOps Task Traffic"

  ingress {
    from_port   = 5115
    to_port     = 5118
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}