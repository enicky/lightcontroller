#!/bin/bash

# Start sshd if we don't use the init system
if [ "$INITSYSTEM" != "on" ]; then
    echo "starting sshdeamon"
  /usr/sbin/sshd -p 22 &
fi

echo "starting modprobe ... "
modprobe i2c-dev

export DIRECTORY=/data/MySensors

echo "check for existing directory $DIRECTORY"

if [ ! -d "$DIRECTORY" ]; then
    echo "start build mysensors stuff ... "
    cd /data && ls -la && git clone https://github.com/mysensors/MySensors.git --branch master  && cd MySensors && ls -la \
        && ./configure --my-gateway=mqtt --my-controller-ip-address=127.0.0.1 \
            --my-mqtt-publish-topic-prefix=mysensors-out --my-mqtt-subscribe-topic-prefix=mysensors-in --my-mqtt-client-id=mygateway1 \
            --soc=BCM2836 --cpu-flags="-march=armv7-a -mtune=cortex-a7 -mfpu=neon-vfpv4 -mfloat-abi=hard" \
        && make \
        && make install
fi

echo "install ..."
cd /data/MySensors && make && make install

echo "enable mysgw service";
systemctl enable mysgw.service 
echo "start mysgw service"
systemctl start mysgw.service


echo "This is where your application would start..."
cd /app && npm start
echo "started app"