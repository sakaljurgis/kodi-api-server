import { BadRequestException } from '@nestjs/common';

export type PlaybackEvent = 'start' | 'tick' | 'pause' | 'stop' | 'end';

const EVENTS: PlaybackEvent[] = ['start', 'tick', 'pause', 'stop', 'end'];

/** a player's progress report, positions in seconds */
export class PlaybackReport {
  constructor(
    readonly position: number,
    readonly duration: number | null,
    readonly event: PlaybackEvent,
    readonly client: string | null,
    /**
     * when it happened (ms since epoch), only for reports sent late (offline,
     * imported history); live reports leave it out and get the server's time
     */
    readonly at: number | null,
  ) {}

  static fromBody(body: Record<string, unknown>): PlaybackReport {
    const position = Number(body?.position);
    if (!Number.isFinite(position) || position < 0) {
      throw new BadRequestException('position (seconds) is required');
    }
    const duration = Number(body.duration);
    const at = Number(body.at);

    return new PlaybackReport(
      position,
      Number.isFinite(duration) && duration > 0 ? duration : null,
      EVENTS.find((event) => event === body.event) ?? 'tick',
      typeof body.client === 'string' ? body.client.slice(0, 32) : null,
      Number.isFinite(at) && at > 0 ? at : null,
    );
  }
}
