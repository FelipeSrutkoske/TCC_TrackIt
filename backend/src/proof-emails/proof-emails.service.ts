import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import nodemailer from 'nodemailer';
import { Repository } from 'typeorm';
import { deflateSync } from 'zlib';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { Delivery } from '../deliveries/entities/delivery.entity';
import { DeliveryProofEmail, ProofEmailStatus } from './entities/delivery-proof-email.entity';

interface ProofEmailContent {
  html: string;
  attachments: Array<{
    cid: string;
    content: Buffer;
    contentType: string;
    filename: string;
  }>;
}

@Injectable()
export class DeliveryProofEmailsService {
  private readonly logger = new Logger(DeliveryProofEmailsService.name);

  constructor(
    @InjectRepository(DeliveryProofEmail)
    private readonly proofEmailsRepository: Repository<DeliveryProofEmail>,
    private readonly deliveriesService: DeliveriesService,
  ) {}

  findByDelivery(deliveryId: number): Promise<DeliveryProofEmail[]> {
    return this.proofEmailsRepository.find({
      where: { deliveryId },
      order: { dataEnvio: 'DESC' },
    });
  }

  async sendDeliveryProof(
    deliveryId: number,
    emailDestinoManual?: string,
  ): Promise<DeliveryProofEmail> {
    const delivery = await this.deliveriesService.findOne(deliveryId);
    const emailDestino = this.resolveRecipient(delivery, emailDestinoManual);

    if (!emailDestino) {
      return this.saveHistory({
        deliveryId,
        emailDestino: null,
        status: ProofEmailStatus.SEM_DESTINATARIO,
        erro: 'Entrega sem email de comprovante ou email de empresa',
      });
    }

    if (process.env.PROOF_EMAIL_ENABLED !== 'true') {
      return this.saveHistory({
        deliveryId,
        emailDestino,
        status: ProofEmailStatus.FALHOU,
        erro: 'Envio de comprovante desabilitado',
      });
    }

    try {
      await this.sendHtmlEmail(emailDestino, delivery);
      return this.saveHistory({
        deliveryId,
        emailDestino,
        status: ProofEmailStatus.ENVIADO,
        erro: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar email';
      this.logger.warn(`Falha ao enviar comprovante deliveryId=${deliveryId}: ${message}`);
      return this.saveHistory({
        deliveryId,
        emailDestino,
        status: ProofEmailStatus.FALHOU,
        erro: message,
      });
    }
  }

  private saveHistory(data: {
    deliveryId: number;
    emailDestino: string | null;
    status: ProofEmailStatus;
    erro: string | null;
  }): Promise<DeliveryProofEmail> {
    return this.proofEmailsRepository.save(this.proofEmailsRepository.create(data));
  }

  private resolveRecipient(delivery: Delivery, manual?: string): string | null {
    const deliveryEmail = (delivery as Delivery & { proofEmail?: string; proofEmailRecipient?: string })
      .proofEmailRecipient ?? (delivery as Delivery & { proofEmail?: string }).proofEmail;

    return manual?.trim() || deliveryEmail?.trim() || delivery.company?.contactEmail?.trim() || null;
  }

  private async sendHtmlEmail(emailDestino: string, delivery: Delivery): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });

    const content = await this.buildEmailContent(delivery);

    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? 'TrackIt <no-reply@trackit.local>',
      to: emailDestino,
      subject: `Comprovante de entrega #${delivery.id}`,
      html: content.html,
      attachments: content.attachments,
    });
  }

  private async buildEmailContent(delivery: Delivery): Promise<ProofEmailContent> {
    const map = await this.buildMapBlock(delivery);
    const signature = this.buildSignatureBlock(delivery.id, delivery.finalization?.signatureUrl);

    return {
      html: this.buildHtml(delivery, map.html, signature.html),
      attachments: [map.attachment, signature.attachment].filter(
        (attachment): attachment is ProofEmailContent['attachments'][number] => Boolean(attachment),
      ),
    };
  }

  private buildHtml(delivery: Delivery, mapHtml: string, signatureHtml: string): string {
    const finalization = delivery.finalization;
    const occurrences = delivery.occurrences ?? [];
    const companyName = delivery.company?.tradeName || delivery.company?.corporateName || '-';
    const driverName = delivery.driver?.user?.nome || '-';
    const gpsStatus = finalization?.gpsDivergente
      ? { label: 'GPS divergente', color: '#b45309', bg: '#fff7ed' }
      : finalization?.gpsValidado
        ? { label: 'GPS validado', color: '#15803d', bg: '#f0fdf4' }
        : { label: 'GPS sem validacao', color: '#475569', bg: '#f8fafc' };
    const occurrenceCards = occurrences.length
      ? occurrences
          .map(
            (occurrence) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
                  <strong style="color:#111827;">${this.escape(occurrence.tipoOcorrencia)}</strong><br />
                  <span style="color:#64748b;font-size:13px;">${this.escape(occurrence.descricao || 'Sem descricao')}</span>
                </td>
              </tr>
            `,
          )
          .join('')
      : '<tr><td style="padding:12px 0;color:#64748b;">Nenhuma ocorrencia registrada.</td></tr>';

    return `
      <!doctype html>
      <html>
        <body style="margin:0;background:#eef1ee;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef1ee;padding:24px 0;">
            <tr>
              <td align="center">
                <table role="presentation" width="680" cellspacing="0" cellpadding="0" style="width:680px;max-width:100%;background:#ffffff;border:1px solid #d7ddd7;border-radius:18px;overflow:hidden;">
                  <tr>
                    <td style="background:#1f2320;padding:26px 30px;color:#ffffff;">
                      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#a8bc94;font-weight:700;">TrackIt</div>
                      <h1 style="margin:10px 0 4px;font-size:28px;line-height:1.2;">Comprovante auditavel de entrega #${delivery.id}</h1>
                      <p style="margin:0;color:#cbd5c7;font-size:14px;">Evidencias registradas para auditoria operacional last mile.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px 30px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:18px;">
                        <tr>
                          <td style="padding:16px;border:1px solid #e5e7eb;border-radius:14px;background:#f8faf8;">
                            <strong style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;">Empresa</strong>
                            <span style="display:block;margin-top:4px;font-size:16px;font-weight:700;color:#111827;">${this.escape(companyName)}</span>
                          </td>
                          <td width="14"></td>
                          <td style="padding:16px;border:1px solid #e5e7eb;border-radius:14px;background:#f8faf8;">
                            <strong style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;">Motorista</strong>
                            <span style="display:block;margin-top:4px;font-size:16px;font-weight:700;color:#111827;">${this.escape(driverName)}</span>
                          </td>
                        </tr>
                      </table>

                      <div style="padding:16px 18px;border-left:5px solid #4f654b;background:#f8faf8;border-radius:12px;margin-bottom:20px;">
                        <strong style="display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1.4px;">Destino</strong>
                        <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#111827;">${this.escape(delivery.destinationAddress)}</p>
                      </div>

                      <h2 style="font-size:18px;margin:0 0 12px;color:#111827;">Recebedor</h2>
                      ${this.infoTable([
                        ['Nome', finalization?.receiverName || '-'],
                        ['Documento', finalization?.receiverDocument || '-'],
                        ['Parentesco/cargo', finalization?.receiverRelation || '-'],
                        ['Inicio', this.formatDate(delivery.dataHoraInicio)],
                        ['Finalizacao', this.formatDate(finalization?.finalizedAt)],
                      ])}

                      <h2 style="font-size:18px;margin:24px 0 12px;color:#111827;">Auditoria GPS</h2>
                      <div style="padding:14px 16px;border:1px solid #e5e7eb;border-radius:14px;background:${gpsStatus.bg};margin-bottom:14px;">
                        <strong style="color:${gpsStatus.color};font-size:14px;">${gpsStatus.label}</strong>
                        <p style="margin:6px 0 0;color:#475569;font-size:13px;">Distancia ate o destino: ${finalization?.distanciaDestinoMetros ?? '-'} m</p>
                      </div>
                      ${this.infoTable([
                        ['GPS inicio', `${delivery.latitudeInicio ?? '-'}, ${delivery.longitudeInicio ?? '-'}`],
                        ['GPS final', `${finalization?.latitude ?? '-'}, ${finalization?.longitude ?? '-'}`],
                        ['Precisao GPS', `${finalization?.gpsAccuracyMeters ?? '-'} m`],
                      ])}

                      ${mapHtml}

                      <h2 style="font-size:18px;margin:24px 0 12px;color:#111827;">Assinatura digital</h2>
                      <div style="border:1px solid #e5e7eb;border-radius:14px;background:#ffffff;padding:16px;text-align:center;">
                        ${signatureHtml}
                      </div>

                      <h2 style="font-size:18px;margin:24px 0 12px;color:#111827;">Ocorrencias</h2>
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:14px;padding:0 16px;background:#ffffff;">
                        ${occurrenceCards}
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 30px;background:#f8faf8;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;line-height:1.5;">
                      Este comprovante foi gerado automaticamente pelo TrackIt para fins de rastreabilidade e auditoria. Valide os dados no painel operacional quando necessario.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private async buildMapBlock(delivery: Delivery): Promise<{
    html: string;
    attachment: ProofEmailContent['attachments'][number] | null;
  }> {
    const finalization = delivery.finalization;
    const latitude = this.toNumber(finalization?.latitude);
    const longitude = this.toNumber(finalization?.longitude);
    const mapUrl = latitude !== null && longitude !== null
      ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      : null;
    const mode = process.env.PROOF_EMAIL_MAP_MODE ?? 'link';

    if (mode === 'none' || !mapUrl) {
      return { html: '', attachment: null };
    }

    if (mode === 'static' && process.env.GOOGLE_MAPS_API_KEY) {
      const cid = `delivery-map-${delivery.id}`;
      const staticUrl = this.buildStaticMapUrl(latitude!, longitude!);

      try {
        const response = await fetch(staticUrl);
        if (response.ok) {
          return {
            html: `
              <h2 style="font-size:18px;margin:24px 0 12px;color:#111827;">Mapa da finalizacao</h2>
              <a href="${mapUrl}" style="text-decoration:none;">
                <img src="cid:${cid}" alt="Mapa da finalizacao" style="display:block;width:100%;max-width:620px;border-radius:14px;border:1px solid #e5e7eb;" />
              </a>
            `,
            attachment: {
              cid,
              content: Buffer.from(await response.arrayBuffer()),
              contentType: 'image/png',
              filename: `mapa-entrega-${delivery.id}.png`,
            },
          };
        }
      } catch (error) {
        this.logger.warn(
          `Mapa estatico indisponivel deliveryId=${delivery.id}: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
        );
      }
    }

    return {
      html: `
        <h2 style="font-size:18px;margin:24px 0 12px;color:#111827;">Mapa da finalizacao</h2>
        <a href="${mapUrl}" style="display:inline-block;background:#4f654b;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 16px;border-radius:12px;">Abrir local no Google Maps</a>
      `,
      attachment: null,
    };
  }

  private buildStaticMapUrl(latitude: number, longitude: number): string {
    const params = new URLSearchParams({
      center: `${latitude},${longitude}`,
      zoom: '16',
      size: '640x320',
      scale: '2',
      maptype: 'roadmap',
      markers: `color:green|label:E|${latitude},${longitude}`,
      key: process.env.GOOGLE_MAPS_API_KEY ?? '',
    });

    return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  }

  private infoTable(rows: Array<[string, string]>): string {
    return `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;">
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <td style="padding:11px 14px;background:#f8faf8;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;width:38%;">${this.escape(label)}</td>
                <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;color:#111827;font-size:14px;font-weight:600;">${this.escape(value)}</td>
              </tr>
            `,
          )
          .join('')}
      </table>
    `;
  }

  private buildSignatureBlock(deliveryId: number, signature?: string | null): {
    html: string;
    attachment: ProofEmailContent['attachments'][number] | null;
  } {
    if (!signature) {
      return {
        html: '<span style="color:#64748b;font-size:13px;">Assinatura nao informada</span>',
        attachment: null,
      };
    }

    const parsed = this.parseSig2(signature);
    if (!parsed) {
      return {
        html: `<span style="color:#64748b;font-size:13px;">${this.escape(signature)}</span>`,
        attachment: null,
      };
    }

    const cid = `delivery-signature-${deliveryId}`;
    return {
      html: `<img src="cid:${cid}" alt="Assinatura digital" style="display:block;margin:0 auto;max-width:100%;height:auto;background:#ffffff;" />`,
      attachment: {
        cid,
        content: this.createSignaturePng(parsed.width, parsed.height, parsed.strokes),
        contentType: 'image/png',
        filename: `assinatura-entrega-${deliveryId}.png`,
      },
    };
  }

  private parseSig2(signature: string): { width: number; height: number; strokes: Array<Array<[number, number]>> } | null {
    const match = signature.match(/^sig(2?):(\d+)x(\d+):(.+)$/);
    if (!match) return null;

    const isMultiStroke = match[1] === '2';
    const width = Number(match[2]);
    const height = Number(match[3]);
    const strokes = (isMultiStroke ? match[4].split('|') : [match[4]])
      .map((stroke) => this.parseSignatureStroke(stroke))
      .filter((stroke) => stroke.length > 0);

    if (!Number.isFinite(width) || !Number.isFinite(height) || !strokes.length) return null;
    return { width, height, strokes };
  }

  private parseSignatureStroke(stroke: string): Array<[number, number]> {
    return stroke
      .split(';')
      .map((point) => point.trim())
      .filter(Boolean)
      .map((point): [number, number] | null => {
        const [x, y] = point.split(',').map(Number);
        return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
      })
      .filter((point): point is [number, number] => Boolean(point));
  }

  private createSignaturePng(width: number, height: number, strokes: Array<Array<[number, number]>>): Buffer {
    const rgba = Buffer.alloc(width * height * 4, 255);

    for (const points of strokes) {
      for (let i = 1; i < points.length; i += 1) {
        this.drawLine(rgba, width, height, points[i - 1], points[i]);
      }
    }

    const scanlines = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y += 1) {
      const sourceStart = y * width * 4;
      const targetStart = y * (width * 4 + 1) + 1;
      rgba.copy(scanlines, targetStart, sourceStart, sourceStart + width * 4);
    }

    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      this.pngChunk('IHDR', Buffer.concat([
        this.uint32(width),
        this.uint32(height),
        Buffer.from([8, 6, 0, 0, 0]),
      ])),
      this.pngChunk('IDAT', deflateSync(scanlines)),
      this.pngChunk('IEND', Buffer.alloc(0)),
    ]);
  }

  private drawLine(
    rgba: Buffer,
    width: number,
    height: number,
    from: [number, number],
    to: [number, number],
  ): void {
    const steps = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]), 1);
    for (let i = 0; i <= steps; i += 1) {
      const x = Math.round(from[0] + ((to[0] - from[0]) * i) / steps);
      const y = Math.round(from[1] + ((to[1] - from[1]) * i) / steps);
      this.drawPoint(rgba, width, height, x, y);
    }
  }

  private drawPoint(rgba: Buffer, width: number, height: number, x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        if (dx * dx + dy * dy > 4) continue;

        const pixelX = x + dx;
        const pixelY = y + dy;
        if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) continue;

        const offset = (pixelY * width + pixelX) * 4;
        rgba[offset] = 17;
        rgba[offset + 1] = 24;
        rgba[offset + 2] = 39;
        rgba[offset + 3] = 255;
      }
    }
  }

  private pngChunk(type: string, data: Buffer): Buffer {
    const typeBuffer = Buffer.from(type, 'ascii');
    const crc = this.crc32(Buffer.concat([typeBuffer, data]));

    return Buffer.concat([
      this.uint32(data.length),
      typeBuffer,
      data,
      this.uint32(crc),
    ]);
  }

  private uint32(value: number): Buffer {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
  }

  private crc32(buffer: Buffer): number {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let i = 0; i < 8; i += 1) {
        crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
      }
    }

    return (crc ^ 0xffffffff) >>> 0;
  }

  private formatDate(value?: Date | string | null): string {
    if (!value) return '-';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleString('pt-BR', {
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
  }

  private toNumber(value?: number | string | null): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
