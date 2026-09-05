export function getIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    // Standard public Google STUN servers
    {
      urls: [
        "stun:stun.l.google.com:19302",
        "stun:stun1.l.google.com:19302",
        "stun:stun2.l.google.com:19302",
      ],
    },
  ];

  // If production TURN server is configured (e.g. Coturn, Twilio, Metered)
  if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
    servers.push({
      urls: process.env.TURN_SERVER_URL,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_PASSWORD,
    });
  }

  return servers;
}

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: getIceServers(),
  iceCandidatePoolSize: 10,
};
