import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import appConfig from 'src/config/app.config';
// import { AdminGuard } from 'src/guards/admin.guard';
// import { AuthGuard } from 'src/guards/auth.guard';
import { AuthRequest } from 'src/types';
import ServerResponse from 'src/utils/ServerResponse';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { profilePictureUploadConfig } from 'src/config/file-upload.config';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('user')
@ApiTags('users')
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Post('create')
  async create(@Body() dto: CreateUserDTO) {
    const response = await this.userService.create(dto);
    return ServerResponse.success('User created successfully', response);
  }

  @Put('update')
  @UseGuards(AuthGuard)
  async update(@Req() req: AuthRequest, @Body() dto: UpdateUserDto) {
    console.log(req.user.id);
    const user = await this.userService.update(req.user.id, dto);
    return ServerResponse.success('User updated successfully', { user });
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Req() req: AuthRequest) {
    const user = await this.userService.findById(req.user.id);
    return ServerResponse.success('User fetched successfully', { user });
  }

  @Get('all')
  @UseGuards(AdminGuard)
  @ApiQuery({ name: 'page', required: false, example: 0 })
  @ApiQuery({ name: 'limit', required: false, example: 10 })
  @ApiParam({ name: 'status', required: false })
  async all(
    @Query('page') page: number = 0,
    @Query('limit') limit: number = 10,
    @Param('status') status?: 'VERIFIED' | 'UNVERIFIED' | 'PENDING',
  ) {
    const users = await this.userService.findAll(page, limit, status);
    return ServerResponse.success('Users fetched successfully', { ...users });
  }

  //   @Get(':id')
  //   @UseGuards(AuthGuard)
  //   @ApiParam({ name: 'id', required: true })
  //   async findById(@Param('id') id: string) {
  //     const user = await this.userService.findById(id);
  //     return ServerResponse.success('User fetched successfully', { user });
  //   }

  //   @Get('search/:query')
  //   @ApiParam({ name: 'query', required: true })
  //   async search(@Param('query') query: string) {
  //     const users = await this.userService.search(query);
  //     return ServerResponse.success('Users fetched successfully', { users });
  //   }

  //   @Delete('')
  //   @UseGuards(AuthGuard)
  //   async deleteMyAccount(@Req() req: AuthRequest) {
  //     await this.userService.deleteUser(req.user.id);
  //     return ServerResponse.success('User deleted successfully');
  //   }

  //   @Delete("remove-avatar")
  //   @UseGuards(AuthGuard)
  //   async removeAvatar(@Req() req: AuthRequest) {
  //     const { profilePictureId } = await this.userService.findById(req.user.id)
  //     if (profilePictureId) {
  //       await this.userService.removeProfilePicture(req.user.id);
  //     }
  //     return ServerResponse.success('Avatar removed successfully');
  //   }

  //   @Delete('/delete/:id')
  //   @UseGuards(AdminGuard)
  //   async deleteAccount(@Param('id') id: string) {
  //     await this.userService.deleteUser(id);
  //     return ServerResponse.success('User deleted successfully');
  //   }

  @Patch('/update-avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profilePicture: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('profilePicture', profilePictureUploadConfig),
  )
  @UseGuards(AuthGuard)
  async updateAvatar(
    @Req() req: AuthRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: parseInt(appConfig().files.uploadLimit),
          }),
          // new FileTypeValidator({ fileType: new RegExp('image/*') }),
        ],
      }),
    )
    profilePicture: Express.Multer.File,
  ) {
    try {
      const existingUser = await this.userService.findById(req.user.id);
      if (existingUser?.profilePicture) {
        await this.userService.removeProfilePicture(req.user.id);
      }
      const user = await this.userService.updateAvatar(
        req.user.id,
        profilePicture,
      );
      return ServerResponse.success('Avatar updated successfully', { user });
    } catch (e) {
      throw new HttpException('Error uploading file', 500);
    }
  }
}
