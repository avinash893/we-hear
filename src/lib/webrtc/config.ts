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

  // Production TURN server configuration (Metered, Twilio, Coturn)
  const turnUrl = process.env.NEXT_PUBLIC_TURN_SERVER_URL || process.env.TURN_SERVER_URL;
  const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME || process.env.TURN_USERNAME;
  const turnPass = process.env.NEXT_PUBLIC_TURN_PASSWORD || process.env.TURN_PASSWORD;

  if (turnUrl && turnUser && turnPass) {
    servers.push({
      urls: turnUrl,
      username: turnUser,
      credential: turnPass,
    });
  }

  return servers;
}

export const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: getIceServers(),
  iceCandidatePoolSize: 10,
};
