import { useState, useEffect, useRef } from 'react';
import Peer from 'peerjs';
import { SERVER_URL } from '../core/socket';

export function useWebRTC(socket, showWebcam, username) {
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const activeCalls = useRef({});
  const localStreamRef = useRef(null);

  // 1. Initialize Peer unconditionally so everyone can receive/request streams
  useEffect(() => {
    if (!socket?.id) return;
    
    const url = new URL(SERVER_URL || 'http://localhost:4000');
    const secure = url.protocol === 'https:';
    
    const newPeer = new Peer(socket.id, {
      host: url.hostname,
      port: url.port || (secure ? 443 : 80),
      path: '/peerjs/app',
      secure: secure,
    });

    newPeer.on('open', (id) => {
      console.log('PeerJS Connected. ID:', id);
      setPeer(newPeer);
    });

    // Handle incoming media calls (e.g., from broadcaster)
    newPeer.on('call', (call) => {
      // Answer with our stream if we have one, otherwise answer empty
      call.answer(localStreamRef.current || undefined);
      
      call.on('stream', (remoteStream) => {
        setRemoteStreams(prev => ({
          ...prev,
          [call.peer]: remoteStream
        }));
      });

      call.on('close', () => {
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[call.peer];
          return next;
        });
      });

      activeCalls.current[call.peer] = call;
    });

    // Handle incoming data connections (used as requests for our video stream)
    newPeer.on('connection', (conn) => {
      conn.on('open', () => {
        // Someone connected to us requesting our video stream.
        // If we have a local stream, call them back with it!
        if (localStreamRef.current) {
          const call = newPeer.call(conn.peer, localStreamRef.current);
          
          // Optionally receive their stream if they have one
          call.on('stream', (remoteStream) => {
            setRemoteStreams(prev => ({
              ...prev,
              [conn.peer]: remoteStream
            }));
          });

          call.on('close', () => {
            setRemoteStreams(prev => {
              const next = { ...prev };
              delete next[conn.peer];
              return next;
            });
          });
          
          activeCalls.current[conn.peer] = call;
        }
      });
    });

    newPeer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    return () => {
      newPeer.destroy();
    };
  }, [socket?.id]);

  // 2. Handle Local Webcam Toggle
  useEffect(() => {
    let stream = null;
    let isMounted = true;

    if (showWebcam && peer) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((s) => {
          if (!isMounted) return;
          stream = s;
          setLocalStream(s);
          localStreamRef.current = s;

          // Notify everyone we are broadcasting
          socket.emit("webcam-toggle", { isOn: true, name: username, peerId: peer.id });
        })
        .catch(err => console.error("Failed to get local stream", err));
    } else {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        localStreamRef.current = null;
      }
      if (peer) {
        socket?.emit("webcam-toggle", { isOn: false, name: username });
      }
    }

    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showWebcam, peer, socket, username]);

  // 3. Listen for other users toggling their webcam
  useEffect(() => {
    if (!socket || !peer) return;

    const handleWebcamToggle = (data) => {
      if (data.id === socket.id) return;

      if (data.isOn && data.peerId) {
        // They turned ON their webcam.
        // We ping them via DataConnection so they call us back with their stream!
        peer.connect(data.peerId);
      } else {
        // They turned OFF their webcam
        if (activeCalls.current[data.id]) {
          activeCalls.current[data.id].close();
          delete activeCalls.current[data.id];
        }
        setRemoteStreams(prev => {
          const next = { ...prev };
          delete next[data.id];
          return next;
        });
      }
    };

    socket.on("webcam-toggle", handleWebcamToggle);

    return () => {
      socket.off("webcam-toggle", handleWebcamToggle);
    };
  }, [socket, peer]);

  return { localStream, remoteStreams };
}
