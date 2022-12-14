import { Injectable } from '@nestjs/common';
import { extname } from 'path';

@Injectable()
export class MimeService {
  private mimeNames = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.ogg': 'application/ogg',
    '.ogv': 'video/ogg',
    '.oga': 'audio/ogg',
    '.txt': 'text/plain',
    '.wav': 'audio/x-wav',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    '.m3u': 'application/vnd.apple.mpegurl',
    '.ts': 'video/MP2T',
    '.json': 'application/json',
    '.avi': 'video/x-msvideo',
  };

  getMime(filePath: string): string {
    return this.getMimeNameFromExt(extname(filePath));
  }

  private getMimeNameFromExt(ext): string {
    return this.mimeNames[ext.toLowerCase()] ?? 'application/octet-stream';
  }
}
