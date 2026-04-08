import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import ServerResponse from 'src/utils/ServerResponse';
import { AdminGuard } from 'src/guards/admin.guard';
import { CreateUserDTO } from '../user/dto/create-user.dto';

@Controller('admin')
@ApiTags('admins')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  async stats() {
    const stats = await this.adminService.getStats();
    return ServerResponse.success('Stats fetched successfully', { ...stats });
  }

  @Post('create')
  async create(dto: CreateUserDTO) {
    const admin = await this.adminService.createAdmin(dto);
    return ServerResponse.success('Admin created successfully', { ...admin });
  }
}
