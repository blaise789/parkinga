import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDTO } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'prisma/prisma.service';
import { hash } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { MailService } from 'src/mail/mail.service';
import ServerResponse from 'src/utils/ServerResponse';
import { FileService } from '../file/file.service';
import { ConfigService } from '@nestjs/config';
import { paginator } from 'src/pagination/paginator';
import { VerificationStatus } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private mailService: MailService,
    private prisma: PrismaService,
    private fileService: FileService,
  ) {}
  async create(dto: CreateUserDTO) {
    // handling the input data
    const hashedPassword = await hash(dto.password, 10);
    try {
      //
      const user = await this.prisma.user.create({
        data: {
          ...dto,
          password: hashedPassword,
        },
      });
      // send an email

      await this.mailService.sendWelcomeEmail({
        names: user.firstName + user.lastName,
        email: user.email,
      });

      const token = this.jwtService.sign({ id: user.id });
      return { user, token };
    } catch (err: any) {
      return ServerResponse.error(err.message);
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('user not found');
    }
    //
    if (user.email !== updateUserDto.email)
      await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
          verificationStatus: 'UNVERIFIED',
        },
      });
    else
      await this.prisma.user.update({
        where: { id },
        data: {
          ...updateUserDto,
        },
      });

    return user;
    // return `This action updates a #${id} user`;
  }

  async updateAvatar(userId: string, fileObject: Express.Multer.File) {
    const file = await this.fileService.saveFile(fileObject, 'profiles');
    const user = await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profilePicture: {
          connect: {
            id: file.id,
          },
        },
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.delete({ where: { id } });
    return user;
  }
  async removeProfilePicture(userId: string) {
    const user = await this.findById(userId);
    if (!user || !user.profilePicture) return false;
    await this.fileService.deleteFile(
      user.profilePicture.id,
      `${this.configService.get('PROFILE_FILES_PATH')}/${user.profilePicture.name}`,
    );
    return true;
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        profilePicture: true,
      },
    });
    return user;
  }
  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profilePicture: true },
    });
    return user;
  }

  async findByVerificationCode(code: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationCode: code },
    });
    return user;
  }
  async findAll(
    page: number,
    limit: number,
    status?: 'VERIFIED' | 'UNVERIFIED' | 'PENDING',
  ) {
    // condition for filtering
    const condition = status ? { verificationStatus: status } : {};
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: condition,
        take: Number(limit),
        skip: page * limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({
        where: condition,
      }),
    ]);

    return {
      users,
      meta: paginator({
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
      }),
    };
  }
}
