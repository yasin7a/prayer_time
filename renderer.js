document.addEventListener("DOMContentLoaded", () => {
  const serverUrl = "ws://localhost:3000";
  const prayerButtons = document.querySelectorAll(".remind-button");
  const connectionStatus = document.getElementById("connection-status");
  const lastEvent = document.getElementById("last-event");
  const statusNote = document.getElementById("status-note");

  let socket = null;
  let reconnectTimer = null;
  let reconnectDelay = 1000;

  const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

  const createToken = () => {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  let clientToken = localStorage.getItem("salahReminderToken");
  if (!clientToken) {
    clientToken = createToken();
    localStorage.setItem("salahReminderToken", clientToken);
  }

  const updateConnectionState = (state) => {
    connectionStatus.textContent = state;
    prayerButtons.forEach((btn) => {
      btn.disabled = state !== "Connected";
    });
  };

  const setLastEvent = (message) => {
    lastEvent.textContent = message;
  };

  const setStatusNote = (message) => {
    if (statusNote) {
      statusNote.textContent = message;
    }
  };

  const sendJoin = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "join",
          token: clientToken,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  };

  const sendReminder = (prayer) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setLastEvent("Unable to send reminder while disconnected.");
      updateConnectionState("Disconnected");
      return;
    }

    socket.send(
      JSON.stringify({
        type: "reminder",
        token: clientToken,
        prayer,
        timestamp: new Date().toISOString(),
      }),
    );

    setLastEvent(`Sent ${prayer} reminder to the network.`);
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "connected") {
        updateConnectionState("Connected");
        setStatusNote("Connected to Salah Reminder Network.");
        setLastEvent("Ready to send reminders.");
        return;
      }

      if (data.type === "reminder") {
        const message = `${data.prayer} reminder from community`;
        window.api.notify({ title: "Salah Reminder", body: message });
        setLastEvent(`Received ${data.prayer} reminder.`);
        return;
      }

      if (data.type === "error") {
        setLastEvent(`Server error: ${data.message}`);
        return;
      }
    } catch (error) {
      console.error("Invalid message from server", error);
    }
  };

  const scheduleReconnect = () => {
    if (reconnectTimer) {
      return;
    }

    updateConnectionState("Reconnecting...");
    setStatusNote("Reconnecting to the reminder network...");

    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, reconnectDelay);

    reconnectDelay = Math.min(30000, reconnectDelay * 1.5);
  };

  const connect = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      return;
    }

    socket = new WebSocket(serverUrl);

    socket.addEventListener("open", () => {
      reconnectDelay = 1000;
      updateConnectionState("Connected");
      setStatusNote("Connected to the reminder network.");
      sendJoin();
    });

    socket.addEventListener("message", handleMessage);

    socket.addEventListener("close", () => {
      updateConnectionState("Disconnected");
      setLastEvent("Connection lost. Reconnecting...");
      scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      updateConnectionState("Disconnected");
      setLastEvent("Connection error. Reconnecting...");
      scheduleReconnect();
    });
  };

  prayerButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const prayer = button.dataset.prayer;
      if (!prayerNames.includes(prayer)) {
        setLastEvent("Invalid prayer selected.");
        return;
      }
      sendReminder(prayer);
    });
  });

  updateConnectionState("Connecting...");
  setStatusNote("Connecting to the reminder network...");
  setLastEvent("Waiting for connection...");
  connect();
});
