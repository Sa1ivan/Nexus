export interface MediaAssetFocalPoint {
  readonly x: number;
  readonly y: number;
}

export interface MediaAsset {
  readonly src: string;
  readonly alt: string;
  readonly focalPoint?: MediaAssetFocalPoint;
}

export interface MediaAssetUpdate {
  readonly src?: string;
  readonly alt?: string;
  readonly focalPoint?: MediaAssetFocalPoint;
}
