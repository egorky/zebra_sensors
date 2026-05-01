const API_CONFIG_KEY = 'zebraApiConfig';

/** Dispatched when saved API/branding settings change so Layout and favicon update. */
export const CONFIG_UPDATED_EVENT = 'zebra-sensor-manager-config-updated';

export const notifyConfigUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT));
  }
};

const defaultConfigFromEnv = () => ({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  apikey: import.meta.env.VITE_API_KEY || '',
  logoDataUrl: '',
  faviconDataUrl: '',
});

function appendQueryParams(searchParams, key, value) {
  if (value === undefined || value === null || value === '') return;
  if (Array.isArray(value)) {
    value.forEach((v) => searchParams.append(key, String(v)));
  } else {
    searchParams.set(key, String(value));
  }
}

function buildQuery(obj) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => appendQueryParams(sp, k, v));
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// --- Configuration Management ---
export const saveConfig = (config) => {
  try {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
    notifyConfigUpdated();
    return true;
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
    return false;
  }
};

export const clearSavedConfig = () => {
  try {
    localStorage.removeItem(API_CONFIG_KEY);
    notifyConfigUpdated();
    return true;
  } catch (error) {
    console.error('Error clearing config:', error);
    return false;
  }
};

export const getConfig = () => {
  try {
    const config = localStorage.getItem(API_CONFIG_KEY);
    if (config) {
      const parsed = JSON.parse(config);
      return {
        ...defaultConfigFromEnv(),
        ...parsed,
        logoDataUrl: parsed.logoDataUrl || '',
        faviconDataUrl: parsed.faviconDataUrl || '',
      };
    }
    return defaultConfigFromEnv();
  } catch (error) {
    console.error('Error getting config from localStorage:', error);
    return defaultConfigFromEnv();
  }
};

// --- Generic API Call Helper ---
export const makeApiCall = async (endpoint, options = {}) => {
  const { baseUrl, apikey } = getConfig();

  if (!baseUrl || !apikey) {
    throw new Error('API Base URL or API Key is not configured. Please configure it in the settings page.');
  }

  const url = `${baseUrl}${endpoint}`;

  const headers = {
    Accept: 'application/json',
    apikey: apikey,
    ...options.headers,
  };

  if (options.method === 'POST' || options.method === 'PATCH' || options.method === 'PUT') {
    headers['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData;
    let errorText = response.statusText;
    try {
      const clonedResponse = response.clone();
      errorText = await clonedResponse.text();
      errorData = JSON.parse(errorText);
    } catch (e) {
      errorData = { message: errorText };
    }

    console.error('API Call Failed:', {
      url: url,
      requestOptions: config,
      responseStatus: response.status,
      responseBody: errorText,
    });

    throw new Error(`API call failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
  }

  if (response.status === 200 && options.method === 'DELETE') {
    return { success: true };
  }

  return response.json();
};

// --- Sensor Management ---
export const getSensors = (opts = {}) => {
  const {
    page = 0,
    size = 25,
    text_filter,
    task_id,
    sort_field = 'SORT_FIELD_NAME',
    sort_order = 'SORT_ORDER_ASC',
    statuses,
    exclude_low_battery,
    enrolled_after,
    enrolled_before,
    sensor_task_statuses,
  } = opts;

  const q = buildQuery({
    page,
    size,
    sort_field,
    sort_order,
    text_filter,
    task_id,
    exclude_low_battery,
    enrolled_after,
    enrolled_before,
    statuses,
    sensor_task_statuses,
  });

  return makeApiCall(`/devices/environmental-sensors${q}`);
};

export const enrollSensor = (serialNumber) => {
  return makeApiCall('/devices/sensor-enrollments', {
    method: 'POST',
    body: JSON.stringify({ serial_number: serialNumber }),
  });
};

export const unenrollSensor = (serialNumber) => {
  return makeApiCall(`/devices/sensor-enrollments/${serialNumber}`, {
    method: 'DELETE',
  });
};

// --- Task Management ---
export const getTasks = (opts = {}) => {
  const {
    page = 0,
    size = 25,
    text_filter,
    sort_field = 'SORT_FIELD_NAME',
    sort_order = 'SORT_ORDER_ASC',
    updated_from,
    updated_to,
    statuses,
    sensor_mac_address,
  } = opts;

  const q = buildQuery({
    page,
    size,
    sort_field,
    sort_order,
    text_filter,
    updated_from,
    updated_to,
    statuses,
    sensor_mac_address,
  });

  return makeApiCall(`/environmental/tasks${q}`);
};

export const createTask = (taskDetails) => {
  const body = {
    task_from_details: {
      task_details: taskDetails,
    },
  };
  return makeApiCall('/environmental/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  });
};

export const getTaskDetails = (taskId) => {
  return makeApiCall(`/environmental/tasks/${taskId}`);
};

export const stopTask = (taskId) => {
  return makeApiCall(`/environmental/tasks/${taskId}/stop`, {
    method: 'POST',
  });
};

export const associateSensorToTask = (taskId, sensorId) => {
  return makeApiCall(`/environmental/tasks/${taskId}/sensors`, {
    method: 'POST',
    body: JSON.stringify({ sensor_ids: [sensorId] }),
  });
};

export const addTaskAsset = (taskId, { asset, id_format }) => {
  return makeApiCall(`/environmental/tasks/${taskId}/assets`, {
    method: 'POST',
    body: JSON.stringify({ asset, id_format }),
  });
};

/**
 * Página del log de datos de una tarea (cursor + limit).
 * @see https://developer.zebra.com/apis/data-reporting-electronic-temperature-sensors
 */
export const getTaskLogPage = (taskId, opts = {}) => {
  const { limit = 100, cursor, startTime, endTime, sensorTaskId, deviceId } = opts;
  const q = buildQuery({
    limit,
    cursor,
    startTime,
    endTime,
    sensorTaskId,
    deviceId,
  });
  return makeApiCall(`/data/environmental/tasks/${taskId}/log${q}`);
};

export const getTaskAlarmsPage = (taskId, { page = 0, pageSize = 50, sort_order = 'SORT_ORDER_DESC' } = {}) => {
  const sp = new URLSearchParams();
  sp.set('page.page', String(page));
  sp.set('page.size', String(pageSize));
  sp.set('sort_order', sort_order);
  return makeApiCall(`/environmental/tasks/${taskId}/alarms?${sp.toString()}`);
};
