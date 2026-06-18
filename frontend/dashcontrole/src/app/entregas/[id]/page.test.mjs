import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function readOccurrenceCardSource() {
  const source = fs.readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  const match = source.match(/function OccurrenceCard[\s\S]+?\n}\n\nexport default function DeliveryDetailPage/);

  assert.ok(match, 'OccurrenceCard deve existir na pagina de detalhe da entrega');

  return match[0];
}

test('card de ocorrencia mostra fallback exato quando nao ha coordenadas validas', () => {
  const occurrenceCard = readOccurrenceCardSource();

  assert.match(occurrenceCard, /Coordenadas Indisponiveis/);
  assert.doesNotMatch(occurrenceCard, /formatCoordinates\(occurrence\.latitude, occurrence\.longitude\)/);
});

test('card de ocorrencia mostra Google Maps sem chave de API quando ha coordenadas', () => {
  const occurrenceCard = readOccurrenceCardSource();

  assert.match(occurrenceCard, /https:\/\/www\.google\.com\/maps\?q=/);
  assert.match(occurrenceCard, /output=embed/);
  assert.match(occurrenceCard, /<iframe/);
  assert.match(occurrenceCard, /Abrir no Google Maps/);
  assert.doesNotMatch(occurrenceCard, /NEXT_PUBLIC_GOOGLE_MAPS_API_KEY|GOOGLE_MAPS_API_KEY|process\.env/);
});
