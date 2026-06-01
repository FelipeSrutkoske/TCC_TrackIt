export type StaticMapPoint = {
  latitude: number;
  longitude: number;
};

export function buildStaticMapUrl(
  origin: StaticMapPoint,
  destination: StaticMapPoint,
  apiKey: string,
) {
  const originParam = `${origin.latitude},${origin.longitude}`;
  const destinationParam = `${destination.latitude},${destination.longitude}`;
  const params = new URLSearchParams({
    size: '640x360',
    scale: '2',
    maptype: 'roadmap',
    markers: `color:blue|label:A|${originParam}`,
    key: apiKey,
  });

  params.append('markers', `color:red|label:B|${destinationParam}`);
  params.append('path', `color:0x2563ebff|weight:5|${originParam}|${destinationParam}`);

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}
