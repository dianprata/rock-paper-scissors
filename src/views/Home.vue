<template>
  <div class="home">
    <h1 class="text-uppercase">Game</h1>
    <h1 class="text-uppercase">Rock Paper Scissors</h1>
    <h2>Online</h2>
    <div class="mt-5">
      <img src="@/assets/rock.svg" alt="" width="80px">
      <img src="@/assets/paper.svg" alt="" width="80px" class="mx-5">
      <img src="@/assets/scissors.svg" alt="" width="80px">
    </div>
    <router-link to="/game" class="btn btn-outline-light btn-lg start">Start</router-link>
  </div>
</template>

<script>

export default {
  name: 'Home',
};
</script>
