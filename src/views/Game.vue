<template>
<div class="game">
  <h1>ROUND {{ round }}</h1>

  <b-row>
    <b-col md="6">
      <h3>YOUR SCORE</h3>
      <b-form-rating v-model="yourScore"
                     inline
                     stars="3"
                     size="lg"
                     readonly
                     class="mt-n3"
      ></b-form-rating>
      <div class="mt-3">
        <img src="@/assets/rock.svg"
             alt="rock"
             width="80px"
             class="cursor-pointer"
             v-show="yourChoose === 0 || yourChoose === 3"
             @click="sendChoice(3)">
        <img src="@/assets/paper.svg"
             alt="paper"
             width="80px"
             class="mx-5 cursor-pointer"
             v-show="yourChoose === 0 || yourChoose === 1"
             @click="sendChoice(1)">
        <img src="@/assets/scissors.svg"
             alt="scissors"
             width="80px"
             class="cursor-pointer"
             v-show="yourChoose === 0 || yourChoose === 2"
             @click="sendChoice(2)">
      </div>
    </b-col>
    <b-col md="6">
      <h3>OPPONENT'S SCORE</h3>
      <b-form-rating v-model="opponentsScore"
                     inline
                     stars="3"
                     size="lg"
                     readonly
                     class="mt-n3"
      ></b-form-rating>
      <div class="mt-3" v-show="receivedGameData">
        <img src="@/assets/rock.svg"
             alt="rock"
             width="80px"
             class="cursor-pointer"
             v-show="opponentsChoose === 0 || opponentsChoose === 3"
             @click="opponentsChoose = 3">
        <img src="@/assets/paper.svg"
             alt="paper"
             width="80px"
             class="mx-5 cursor-pointer"
             v-show="opponentsChoose === 0 || opponentsChoose === 1"
             @click="opponentsChoose = 1">
        <img src="@/assets/scissors.svg"
             alt="scissors"
             width="80px"
             class="cursor-pointer"
             v-show="opponentsChoose === 0 || opponentsChoose === 2"
             @click="opponentsChoose = 2">
      </div>
    </b-col>
  </b-row>
  <h1>{{ result }}</h1>
  <router-link to="/" class="btn btn-outline-dark fixed-bottom">Back to Homepage</router-link>
</div>
</template>

<script>
/* eslint-disable */
import mqtt from 'mqtt';

const client = mqtt.connect('ws://broker.mqttdashboard.com:8000/mqtt');

export default {
  name: 'Game',
  data() {
    return {
      round: 1,
      roundTmp: 1,
      yourScore: 0,
      yourChoose: 0,
      opponentsScore: 0,
      opponentsChoose: 0,
      opponentsChooseTmp: 0,
      result: '',
      rooms: [],
      room: {
        topic: '',
        currentPlayer: 0,
        players: [],
      },
      player: {
        clientId: '',
      },
      findRoomTimeout: '',
      roomCode: '',
      stateGame: 'FIND_ROOM',
      turn: 0,
      turnCount: 0,
      receivedGameData: false
    };
  },
  watch: {
    yourScore() {
      setTimeout(() => {
        if (this.yourScore === 3) {
          alert('YOU WIN');
          this.yourScore = 0;
          this.opponentsScore = 0;
          this.round = 1;
          this.result = '';
          this.reset();
        }
      }, 1000);
    },
    opponentsScore() {
      setTimeout(() => {
        if (this.opponentsScore === 3) {
          alert('YOU LOSE');
          this.yourScore = 0;
          this.opponentsScore = 0;
          this.round = 1;
          this.result = '';
          this.reset();
        }
      }, 1000);
    },
  },
  methods: {
    calculate() {
      this.round += 1;
      this.reset();
    },
    logicGame() {
      // Rock 3 > Scissors 2 > Paper 1 > Rock 3.
      if (this.yourChoose !== 0 && this.opponentsChoose !== 0) {
        if (this.yourChoose > this.opponentsChoose) {
          if (this.yourChoose === 3 && this.opponentsChoose === 1) {
            this.opponentsScore += 1;
            this.result = 'YOU LOSE';
          } else {
            this.yourScore += 1;
            this.result = 'YOU WIN';
          }
        }
        if (this.yourChoose < this.opponentsChoose) {
          if (this.yourChoose === 1 && this.opponentsChoose === 3) {
            this.yourScore += 1;
            this.result = 'YOU WIN';
          } else {
            this.opponentsScore += 1;
            this.result = 'YOU LOSE';
          }
        }
        if (this.yourChoose === this.opponentsChoose) {
          this.result = 'TIE';
        }
        this.calculate();
      }
    },
    reset() {
      this.yourChoose = 0;
      this.opponentsChoose = 0;
      this.opponentsChooseTmp = 0;
      setTimeout(() => {
        this.result = '';
      }, 1000);
    },
    subscribeQueue() {
      return client.subscribe('queue');
    },
    unsubscribeQueue() {
      return client.unsubscribe('queue');
    },
    subscribeRoom(roomCode) {
      client.subscribe(roomCode);
      this.roomCode = roomCode;
      this.stateGame = 'PLAYGAME';
    },
    createRoom() {
      const c = client;
      const message = { topic: `room-${Math.random().toString(16).substr(2, 8)}`, player: 1 };
      this.turn = message.player;
      const timer = setTimeout(() => {
        c.publish('queue', JSON.stringify(message));
        this.unsubscribeQueue();
        this.subscribeRoom(message.topic);
        return message;
      }, 10 * 1000);

      return {
        timer,
        message
      };
    },
    findRoom(topic, message) {
      const c = client;
      const messageJson = JSON.parse(message);
      if (messageJson.player === 1 && messageJson.topic !== this.findRoomTimeout.message.topic) {
        clearTimeout(this.findRoomTimeout.timer);
        return messageJson;
      } else {
        return null;
      }
    },
    joinRoom(roomData) {
      const c = client;
      const queueMessage = roomData;
      console.log(queueMessage);
      queueMessage.player += 1;
      this.turn = queueMessage.player;
      c.publish('queue', JSON.stringify(queueMessage));
      this.subscribeRoom(roomData.topic);
      return queueMessage;
    },
    sendChoice(choice) {
      const c = client;
      this.yourChoose = choice;

      const gameData = { turn: this.turn, choose: this.yourChoose, round: this.round };
      c.publish(this.roomCode, JSON.stringify(gameData));

    },
    receiveChoice(gameData) {
      const gameDataJson = JSON.parse(gameData);
      if(gameDataJson.turn !== this.turn && gameDataJson) {
        this.opponentsChooseTmp = gameDataJson.choose;
      }
      if(this.opponentsChooseTmp !== 0 && this.opponentsChooseTmp !== undefined) {
        this.opponentsChoose = this.opponentsChooseTmp;
        if(this.yourChoose !== 0 && this.opponentsChoose !== 0) {
          this.logicGame();
        }
        if(this.round !== gameDataJson.round) {
          this.reset();
        }
      }
    },
    runtimeMqtt() {
      const c = client;
      let loader = this.$loading.show({
        loader: 'spinner'
      });
      c.on('connect', () => {
        this.subscribeQueue();
        this.findRoomTimeout = this.createRoom();
        setTimeout(() => {
          loader.hide();
        }, 10 * 1000);
      });

      // sedang dalam antrian
      if(this.stateGame === 'FIND_ROOM') {
        c.on('message', (topic, message) => {
          const roomData = this.findRoom(topic, message);

          if(roomData) {
            this.joinRoom(roomData);
            setTimeout(() => {
              loader.hide();
            }, 10 * 1000);
          }
        });
      }
    },
  },
  created() {
    const c = client;
    this.runtimeMqtt();
    setInterval(() => {
      if(this.stateGame === "PLAYGAME") {
        c.on('message', (topic, message) => {
          this.receiveChoice(message);
        });
      }
    }, 1000);
  },
};
</script>

<style scoped>

</style>
