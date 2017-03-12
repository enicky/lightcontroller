#FROM resin/raspberrypi2-node:latest
FROM resin/raspberrypi2-node:onbuild

ENV INITSYSTEM on

RUN wget http://repo.mosquitto.org/debian/mosquitto-repo.gpg.key && apt-key add mosquitto-repo.gpg.key 
RUN cd /etc/apt/sources.list.d/ \
    && wget http://repo.mosquitto.org/debian/mosquitto-jessie.list \
    && apt-get update && apt-get install -y mosquitto 
RUN /etc/init.d/mosquitto start

RUN apt-get update && apt-get install -yq --no-install-recommends \
    openssh-server && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN mkdir /var/run/sshd \
    && echo 'root:resin' | chpasswd \
    && sed -i 's/PermitRootLogin without-password/PermitRootLogin yes/' /etc/ssh/sshd_config \
    && sed -i 's/UsePAM yes/UsePAM no/' /etc/ssh/sshd_config

#RUN cd && pwd && git clone https://github.com/mysensors/MySensors.git --branch master  && cd MySensors && ls -la \
#    && ./configure --my-gateway=mqtt --my-controller-ip-address=127.0.0.1 \
#        --my-mqtt-publish-topic-prefix=mysensors-out --my-mqtt-subscribe-topic-prefix=mysensors-in --my-mqtt-client-id=mygateway1 \
#        --soc=BCM2836 --cpu-flags="-march=armv7-a -mtune=cortex-a7 -mfpu=neon-vfpv4 -mfloat-abi=hard" \
#    && make \
#    && make install \
#    && systemctl enable mysgw.service \
#    && systemctl start mysgw.service

#Already done ... 
ADD package.json /app/package.json
RUN cd /app && npm install

ADD . /app
RUN chmod +x /app/src/start.sh


CMD ["/app/src/start.sh"]

#CMD ["node", "/app/app.js"]