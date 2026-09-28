import { parseBuffer } from 'music-metadata';
import crypto from 'crypto';

export interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  albumArtist?: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  discNumber?: number;
  duration?: number;
  bitrate?: number;
  codec?: string;
  sampleRate?: number;
  channels?: number;
  format?: string;
  hasArtwork?: boolean;
  artworkBuffer?: Buffer;
  artworkFormat?: string;
}

export class MetadataService {
  async extractMetadata(fileBuffer: Buffer, filename: string): Promise<AudioMetadata> {
    try {
      const metadata = await parseBuffer(fileBuffer, {
        mimeType: this.getMimeType(filename),
        size: fileBuffer.length,
      });

      const common = metadata.common;
      const format = metadata.format;

      const result: AudioMetadata = {
        title: common.title,
        artist: common.artist?.[0],
        album: common.album,
        albumArtist: common.albumartist?.[0],
        genre: common.genre?.[0],
        year: common.year,
        trackNumber: common.track?.no ?? undefined,
        discNumber: common.disk?.no ?? undefined,
        duration: format.duration,
        bitrate: format.bitrate,
        codec: format.codec,
        sampleRate: format.sampleRate,
        channels: format.numberOfChannels,
        format: format.container,
        hasArtwork: common.picture && common.picture.length > 0,
      };

      if (result.hasArtwork && common.picture && common.picture.length > 0) {
        result.artworkBuffer = common.picture[0].data;
        result.artworkFormat = common.picture[0].format;
      }

      return result;
    } catch (error) {
      console.error('Error extracting metadata:', error);
      return this.getBasicMetadata(filename);
    }
  }

  private getBasicMetadata(filename: string): AudioMetadata {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    return {
      title: filename.replace(`.${extension}`, ''),
      artist: 'Unknown Artist',
      album: 'Unknown Album',
      genre: 'Unknown',
      year: new Date().getFullYear(),
      duration: 0,
      bitrate: 0,
      codec: extension,
      hasArtwork: false,
    };
  }

  private getMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    const mimeTypes: Record<string, string> = {
      mp3: 'audio/mpeg',
      flac: 'audio/flac',
      wav: 'audio/wav',
      aac: 'audio/aac',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
    };

    return mimeTypes[extension] || 'audio/mpeg';
  }

  calculateFileHash(fileBuffer: Buffer): string {
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  getFileExtension(filename: string): string {
    // No dot (or a dotfile like ".hidden") means there is no extension.
    const separatorIndex = filename.lastIndexOf('.');
    if (separatorIndex <= 0) return '';
    return filename.slice(separatorIndex + 1).toLowerCase();
  }

  formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const metadataService = new MetadataService();
