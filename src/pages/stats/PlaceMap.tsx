import { Paper } from '@mantine/core'
import { Circle, MapContainer } from 'react-leaflet'
import { Tiles } from '../map/mapUtils'

export default function PlaceMap({ lat, lng }: { lat: number; lng: number }) {
  return (
    <Paper withBorder style={{ overflow: 'hidden', height: 220 }}>
      <MapContainer center={[lat, lng]} zoom={14} style={{ height: '100%' }} scrollWheelZoom={false}>
        <Tiles />
        <Circle center={[lat, lng]} radius={600} pathOptions={{ color: '#f76707', fillOpacity: 0.2, weight: 2 }} />
      </MapContainer>
    </Paper>
  )
}
