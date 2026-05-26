const GAS_URL = 'https://script.google.com/macros/s/AKfycbwrInt26LWZVVmLN_gEtZz1tNHpYfj5UPLwVp-mtlJZFnnaXlx1bvoBUndhjmEp590L/exec';

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const query = new URLSearchParams(params).toString();

  try {
    const response = await fetch(`${GAS_URL}?${query}`, {
      redirect: 'follow',
    });
    const text = await response.text();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: text,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
