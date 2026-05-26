const GAS_URL = 'https://script.google.com/macros/s/AKfycbwrInt26LWZVVmLN_gEtZz1tNHpYfj5UPLwVp-mtlJZFnnaXlx1bvoBUndhjmEp590L/exec';

exports.handler = async (event) => {
  const params = { ...event.queryStringParameters, callback: 'cb' };
  const query = new URLSearchParams(params).toString();

  try {
    const response = await fetch(`${GAS_URL}?${query}`, {
      redirect: 'follow',
    });
    const text = await response.text();

    // JSONPからJSONを取り出す: cb({...}) → {...}
    const json = text.replace(/^cb\(/, '').replace(/\)$/, '').trim();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: json,
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
