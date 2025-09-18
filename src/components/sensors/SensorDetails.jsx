import React from 'react';

const DetailItem = ({ label, value }) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return (
    <div>
      <dt className="font-medium text-gray-600">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
    </div>
  );
};

const SensorDetails = ({ sensor }) => {
  if (!sensor) return null;

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Detalles del Sensor</h3>
      <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
        <DetailItem label="ID" value={sensor.id} />
        <DetailItem label="Modelo" value={sensor.model} />
        <DetailItem label="Fabricante" value={sensor.manufacturer} />
        <DetailItem label="Revisión de Hardware" value={sensor.hardware_revision} />
        <DetailItem label="Revisión de Firmware" value={sensor.firmware_revision} />
        <DetailItem label="Visto por Primera Vez" value={sensor.first_seen ? new Date(sensor.first_seen).toLocaleString() : 'N/A'} />
        <DetailItem label="Última Actualización" value={sensor.last_updated ? new Date(sensor.last_updated).toLocaleString() : 'N/A'} />
        <DetailItem label="Tipo de Certificado" value={sensor.certificate_type} />
        <DetailItem label="URL de Certificado" value={sensor.certificate_url} />
        <DetailItem label="Notas" value={sensor.notes} />
        <DetailItem label="Información Adicional" value={sensor.additional_info} />

        {/* Most Recent Task Info */}
        {sensor.most_recent && (
          <>
            <h4 className="col-span-full font-semibold mt-2">Tarea Más Reciente</h4>
            <DetailItem label="ID de Tarea" value={sensor.most_recent.task_id} />
            <DetailItem label="ID de Sensor-Tarea" value={sensor.most_recent.sensor_task_id} />
            <DetailItem label="Estado de Sensor-Tarea" value={sensor.most_recent.SensorTaskStatus} />
          </>
        )}

        {/* Unverified Data */}
        {sensor.unverified && (
           <>
            <h4 className="col-span-full font-semibold mt-2">Datos no Verificados</h4>
            <DetailItem label="Última Fecha" value={sensor.unverified.last_date_time ? new Date(sensor.unverified.last_date_time).toLocaleString() : 'N/A'} />
            <DetailItem label="Última Temperatura" value={sensor.unverified.last_temperature} />
            <DetailItem label="Última Alarma" value={String(sensor.unverified.last_alarm)} />
          </>
        )}
      </dl>
    </div>
  );
};

export default SensorDetails;
