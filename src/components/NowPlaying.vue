<template>
  <div id="app">
    <div
      v-if="player.playing && player.playingDisplayMode==0"
      class="now-playing"
      :class="getNowPlayingClass()"
    >
    <img class="now-playing__vinylcontainer_background" :src="player.trackAlbum.image">
      <div class="now-playing__cover">
          
        <img
          :src="player.trackAlbum.image"
          :alt="player.trackTitle"
          class="now-playing__image"
        />
        
      </div>
      <div class="now-playing__details" >
        
        <h1 class="now-playing__track" v-text="player.trackTitle"></h1>
        <h3 class="now-playing__track" v-text="player.trackAlbum.title"></h3>
        <h2 class="now-playing__artists" v-text="getTrackArtists"></h2>
     

      </div>
      <div>
  <!-- <vm-progress class="now-playing__progress" :percentage="30" :stroke-width="35" :show-text="false"  v-bind:stroke-color="this.colourPalette.text"></vm-progress> -->
  <vm-progress class="now-playing__progress" v-bind:percentage="currentTrackProgressPercentage" :stroke-width="20" :show-text="false" stroke-color="black" track-color="#888888"></vm-progress>
  <p class="now-playing__progresstext">{{ currentTrackProgressMinutesSeconds }} / {{ currentTrackLengthMinutesSeconds }}</p>



</div>

    </div>  
    <div v-else-if="player.playing && player.playingDisplayMode==1"
      class="now-playing"
      :class="getNowPlayingClass()">
      <img class="now-playing__vinylcontainer_background" :src="player.trackAlbum.image">
    <div class="now-playing__vinylcontainer">
          <img src="vinyl.png"
          class="now-playing__vinyl"  
          />
          <img  
          :src="player.trackAlbum.image"
          class="now-playing__vinylimage"
        />
        </div>
        <div class="now-playing__details_vinyl_upper" >  
          <h2 class="now-playing__track" v-text="player.trackTitle"></h2>
        </div>
        <div class="now-playing__details_vinyl_lower" >  
          <h2 class="now-playing__track" v-text="getTrackArtists"></h2>
        </div>
        <div class="now-playing__details_vinyl_right" >  
          <p class="now-playing__progresstext">{{ currentTrackProgressMinutesSeconds }} / {{ currentTrackLengthMinutesSeconds }}</p>
        </div>
        <vm-progress class="now-playing__progress_vinyl" type="circle" v-bind:percentage="currentTrackProgressPercentage" :stroke-width="20" :show-text="false" width="990"  stroke-color="black" track-color="#888888" ></vm-progress>
  </div>
  
    <div v-else class="now-playing" :class="getNowPlayingClass()">
      <img class="now-playing__marble_background" src="marble.png">
      <h4 class="now-playing__idle-heading">{{ currentDay }}</h4>
     
      <h4 class="now-playing__idle-heading">{{ currentDate }}</h4>
  
      <h4 class="now-playing__idle-heading">{{ currentTime }}</h4>
    </div>
   
  </div>
</template>

<script>
import * as Vibrant from 'node-vibrant'

import props from '@/utils/props.js'

export default {
  name: 'NowPlaying',

  props: {
    auth: props.auth,
    endpoints: props.endpoints,
    player: props.player
  },

  data() {
    return {
      pollPlaying: '',
      playerResponse: {},
      playerData: this.getEmptyPlayer(),
      colourPalette: '',
      swatches: [],
      currentDay: "",
      currentDate: "",
      currentTime: "",
      currentTrackLengthMinutesSeconds: "",
      currentTrackProgressMinutesSeconds: "",
      currentTrackProgressPercentage: 0
    }
  },

  computed: {
    /**
     * Return a comma-separated list of track artists.
     * @return {String}
     */
    getTrackArtists() {
      return this.player.trackArtists.join(', ')
    }
  },
  
  created() {
                setInterval(this.getCurrentDay, 1000);
                setInterval(this.getCurrentDate, 1000);
                setInterval(this.getCurrentTime, 1000);
                setInterval(this.getTrackLengthMinutesSeconds, 1000);
                setInterval(this.getCurrentlyPlayed, 1000);

  },

  mounted() {
    this.setDataInterval()
  },

  beforeDestroy() {
    clearInterval(this.pollPlaying)
  },

  methods: {

    getCurrentDay: function() {
      var d = new Date();
      var str = d.toLocaleString("da-DK", { weekday: "long" })
      var weekday = str.charAt(0).toUpperCase() + str.slice(1);
  
      this.currentDay = weekday;
    },

    getCurrentDate: function() {
      let addZero = (el) => ((el.toString().length == 1) ? '0' : '') + el.toString();
      var d = new Date();
      var year = d.getFullYear();
      var month = d.getMonth() + 1; /*months are from 0 - 11 */
      var day = d.getDate();
      var currentTimestamp = addZero(day) + "-" + addZero(month) + "-" + year  ;
      this.currentDate = currentTimestamp;
    },

    getCurrentTime: function() {
      let addZero = (el) => ((el.toString().length == 1) ? '0' : '') + el.toString();
      var d = new Date();

      var hour = d.getHours();
      var minute = d.getMinutes();
      //var second = d.getSeconds();
      var currentTimestamp = addZero(hour) + ":" + addZero(minute);// + ":" + addZero(second);
      this.currentTime = currentTimestamp;
    },

    millisToMinutesAndSeconds(millis) {
        var minutes = Math.floor(millis / 60000);
        var seconds = ((millis % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
    },

    getCurrentlyPlayed: function() {
      this.currentTrackProgressMinutesSeconds = this.millisToMinutesAndSeconds(this.playerData.trackProgress);
      this.playerData.trackProgress = this.playerData.trackProgress + 1000;
      this.currentTrackProgressPercentage = (this.playerData.trackProgress / this.playerData.trackDuration)*100.0;
//console.log(this.currentTrackProgressPercentage);
    },

    getTrackLengthMinutesSeconds: function() {
        this.currentTrackLengthMinutesSeconds = this.millisToMinutesAndSeconds(this.playerData.trackDuration);
    },

    /**
     * Make the network request to Spotify to
     * get the current played track.
     */
    async getNowPlaying() {
      let data = {}

      try {
        const response = await fetch(
          `${this.endpoints.base}/${this.endpoints.nowPlaying}`,
          {
            headers: {
              Authorization: `Bearer ${this.auth.accessToken}`
            }
          }
        )

        /**
         * Fetch error.
         */
        if (!response.ok) {
          throw new Error(`An error has occured: ${response.status}`)
        }

        /**
         * Spotify returns a 204 when no current device session is found.
         * The connection was successful but there's no content to return.
         */
        if (response.status === 204) {
          data = this.getEmptyPlayer()
          this.playerData = data

          this.$nextTick(() => {
            this.$emit('spotifyTrackUpdated', data)
          })

          return
        }

        data = await response.json()
        this.playerResponse = data;
        this.playerData.trackProgress = this.playerResponse.progress_ms;
        this.playerData.trackDuration = this.playerResponse.item.duration_ms;
     //   console.log("Updated")
        
      } catch (error) {
        this.handleExpiredToken()

        data = this.getEmptyPlayer()
        this.playerData = data

        this.$nextTick(() => {
          this.$emit('spotifyTrackUpdated', data)
        })
      }
    },

    /**
     * Get the Now Playing element class.
     * @return {String}
     */
    getNowPlayingClass() {
      const playerClass = this.player.playing ? 'active' : 'idle'
 

      return `now-playing--${playerClass}`
    },

    /**
     * Get the colour palette from the album cover.
     */
    getAlbumColours() {
      /**
       * No image (rare).
       */
      if (!this.player.trackAlbum?.image) {
        return
      }

      /**
       * Run node-vibrant to get colours.
       */
      Vibrant.from(this.player.trackAlbum.image)
        .quality(1)
        .clearFilters()
        .getPalette()
        .then(palette => {
          this.handleAlbumPalette(palette)
        })
    },

    /**
     * Return a formatted empty object for an idle player.
     * @return {Object}
     */
    getEmptyPlayer() {
      return {
        playing: false,
        playingDisplayMode: 0,
        playingInModeFor: 0,
        trackAlbum: {},
        trackArtists: [],
        trackId: '',
        trackTitle: '',
        trackDuration: 0,
        trackProgress: 0,
        currentTrackLengthMinutesSeconds: ''

      }
    },

    /**
     * Poll Spotify for data.
     */
    setDataInterval() {
      clearInterval(this.pollPlaying)
      this.pollPlaying = setInterval(() => {
        this.getNowPlaying()
      }, 2500)
    },

    /**
     * Set the stylings of the app based on received colours.
     */
    setAppColours() {
      // document.documentElement.style.setProperty(
      //   '--color-text-primary',
      //   this.colourPalette.text
      // )

      // document.documentElement.style.setProperty(  
      //   '--colour-background-now-playing',
      //   this.colourPalette.background
      // )
    },

    /**
     * Handle newly updated Spotify Tracks.
     */
    handleNowPlaying() {

      if(this.player.playing){
       this.player.playingInModeFor--;

        if(this.player.playingInModeFor <=0){
          if(this.player.playingDisplayMode == 0){
            this.player.playingDisplayMode = 1;
          }else{
            this.player.playingDisplayMode = 0;
          }
          this.player.playingInModeFor = 20;
        }
      }

      if (
        this.playerResponse.error?.status === 401 ||
        this.playerResponse.error?.status === 400
      ) {
        this.handleExpiredToken()

        return
      }

      /**
       * Player is active, but user has paused.
       */
      if (this.playerResponse.is_playing === false) {
        this.playerData = this.getEmptyPlayer()

        return
      }

      /**
       * The newly fetched track is the same as our stored
       * one, we don't want to update the DOM yet.
       */
      if (this.playerResponse.item?.id === this.playerData.trackId) {
        return
      }

      this.currentTrackProgressMinutesSeconds = '';
      this.currentTrackLengthMinutesSeconds = '';
      this.currentTrackProgressPercentage = 0;


      /**
       * Store the current active track.
       */
      this.playerData = {
        playing: this.playerResponse.is_playing,
        playingDisplayMode: 0, //0 normal, 1 vinyl
        playingInModeFor: 10,
        trackArtists: this.playerResponse.item.artists.map(
          artist => artist.name
        ),
        trackTitle: this.playerResponse.item.name,
        trackProgress: this.playerResponse.progress_ms,
        trackDuration: this.playerResponse.item.duration_ms,
        trackId: this.playerResponse.item.id,
        trackAlbum: {
          title: this.playerResponse.item.album.name,
          image: this.playerResponse.item.album.images[0].url
        }
      }
    },

    /**
     * Handle newly stored colour palette:
     * - Map data to readable format
     * - Get and store random colour combination.
     */
    handleAlbumPalette(palette) {
      let albumColours = Object.keys(palette)
        .filter(item => {
          return item === null ? null : item
        })
        .map(colour => {
          return {
            text: palette[colour].getTitleTextColor(),
            background: palette[colour].getHex()
          }
        })

      this.swatches = albumColours

      this.colourPalette =
        albumColours[Math.floor(Math.random() * albumColours.length)]

      this.$nextTick(() => {
        this.setAppColours()
      })
    },

    /**
     * Handle an expired access token from Spotify.
     */
    handleExpiredToken() {
      clearInterval(this.pollPlaying)
      this.$emit('requestRefreshToken')
    },
  
  },
  watch: {
    /**
     * Watch the auth object returned from Spotify.
     */
    auth: function(oldVal, newVal) {
      if (newVal.status === false) {
        clearInterval(this.pollPlaying)
      }
    },

    /**
     * Watch the returned track object.
     */
    playerResponse: function() {
      this.handleNowPlaying()
    },

    /**
     * Watch our locally stored track data.
     */
    playerData: function() {
      this.$emit('spotifyTrackUpdated', this.playerData)

      this.$nextTick(() => {
        this.getAlbumColours()
      })
    }
  }
}
</script>

<style src="@/styles/components/now-playing.scss" lang="scss" scoped></style>
