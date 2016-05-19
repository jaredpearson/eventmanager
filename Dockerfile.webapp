
FROM node:4.4.3

# install forever
RUN npm install forever -g
RUN npm install grunt -g

# Copy the source files
RUN mkdir -p /usr/src/app
COPY . /usr/src/app

# Install app deps
RUN cd /usr/src/app; npm install

# Run the grunt dist target
RUN cd /usr/src/app; grunt dist

WORKDIR /usr/src/app

EXPOSE  8289
CMD ["forever", "--minUptime", "1000", "--spinSleepTime", "1000", "index.js"]

VOLUME /usr/src/app/views
