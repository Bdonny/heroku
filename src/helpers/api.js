const sendDynoMetrics = (metrics) => {
  const dyno = "https://dyno-ai.com/wp-json";
  fetch(`${dyno}/metrics/v1/save`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metrics),
  })
    .then((response) => response.json())
    .then((data) => {
      // Handle the response from the server (e.g., show a thank you message)
      console.log("Response from server:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

module.exports = { sendDynoMetrics };
