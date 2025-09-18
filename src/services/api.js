const API_CONFIG_KEY = 'zebraApiConfig';

// --- Configuration Management ---
export const saveConfig = (config) => {
  try {
    localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
    return true;
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
    return false;
  }
};

export const getConfig = () => {
  try {
    const config = localStorage.getItem(API_CONFIG_KEY);
    if (config) {
      return JSON.parse(config);
    }
    return {
      baseUrl: import.meta.env.VITE_API_BASE_URL || '',
      apikey: import.meta.env.VITE_API_KEY || '',
    };
  } catch (error) {
    console.error('Error getting config from localStorage:', error);
    return {
      baseUrl: '',
      apikey: '',
    };
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
    'Accept': 'application/json',
    'apikey': apikey,
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
      // Try to clone the response so we can read it as text and as json
      const clonedResponse = response.clone();
      errorText = await clonedResponse.text();
      errorData = JSON.parse(errorText);
    } catch (e) {
      // If parsing as JSON fails, we'll just use the text content
      errorData = { message: errorText };
    }

    console.error('API Call Failed:', {
      url: url,
      requestOptions: config,
      responseStatus: response.status,
      responseBody: errorText, // Log the raw text response
    });

    throw new Error(`API call failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
  }

  // For DELETE requests, a 200 OK with no body is common.
  if (response.status === 200 && options.method === 'DELETE') {
    return { success: true };
  }

  return response.json();
};


// --- Sensor Management ---
export const getSensors = () => {
  return makeApiCall('/devices/environmental-sensors?size=100');
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
export const getTasks = () => {
  return makeApiCall('/environmental/tasks?size=100');
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

export const addTaskAsset = (taskId, asset) => {
  // Assuming the asset is just a string for now.
  // The API spec shows { "asset": "<string>", "id_format": "..." }
  // We might need to adjust this later if id_format is required.
  return makeApiCall(`/environmental/tasks/${taskId}/assets`, {
    method: 'POST',
    body: JSON.stringify({ asset: asset }),
  });
};

export const getTaskData = (taskId) => {
  return makeApiCall(`/data/environmental/tasks/${taskId}/log?limit=500`);
};

export const getTaskAlarms = (taskId) => {
  return makeApiCall(`/environmental/tasks/${taskId}/alarms`);
};
