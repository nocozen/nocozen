<script lang="ts">
import SmoothScrollbar from "smooth-scrollbar"
import { h } from "vue"

import _ from "./helpers"

const defaultOptions = {
  damping: 0.1,
  thumbMinSize: 6,
  renderByPixels: true,
  alwaysShowTracks: false,
  continuousScrolling: false,
  delegateTo: null,
  plugins: {},
}

const Event = {
  loading: "loading",
  endY: "endy",
  endX: "endX",
  scroll: "scroll",
}

export default {
  name: "c-scroll-view",
  props: {
    hideScrollbar: {
      type: Boolean,
      default: false,
    },
    infiniteLoading: {
      type: Boolean,
      default: false,
    },
    loadThreshold: {
      type: Number,
      default: 50,
    },
    options: {
      type: Object,
      default: () => ({}),
    },
    plugins: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      resolve: true,
      loading: false,
      completed: false,
      scrollBar: null,
      listeners: [],
      meta: {
        limit: {},
        offset: {},
      },
    }
  },
  computed: {
    hasPlugins() {
      const self = this as any;
      if (_.isArray(self.plugins)) {
        return !!self.plugins.length
      } else {
        return false
      }
    },
  },
  methods: {
    /**
     * @param {String} axis - x or y axis
     * @return {Object}
     */
    getLimit(axis = "") {
      const self = this as any;
      return _.getScrollState(self.scrollBar, axis, "limit")
    },

    /**
     * @param {String} axis - x or y axis
     * @return {Object}
     */
    getOffset(axis = "") {
      const self = this as any;
      return _.getScrollState(self.scrollBar, axis, "offset")
    },

    // Smooth-scrollbar api methods
    /**
     *
     * @param {Number} x
     * @param {Number} y
     * @param {Number} duration
     * @param {Object} options
     */
    scrollTo(x = 0, y = 0, duration = 300, options = {}) {
      const self = this as any;
      self.scrollBar.scrollTo(x, y, duration, options)
    },

    /**
     *
     * @param {HTMLElement} elem
     * @param {Object} [options]
     */
    scrollIntoView(elem: any, options = {}) {
      const self = this as any;
      self.scrollBar.scrollIntoView(elem, options)
    },

    /**
     *
     * @param {HTMLElement} elem
     */
    isVisible(elem: any) {
      const self = this as any;
      self.scrollBar.isVisible(elem)
    },

    /**
     *
     * @param {Function} listener
     */
    addListener(listener: any) {
      const self = this as any;
      self.listeners.push(listener)
      self.scrollBar.addListener(listener)
    },

    /**
     *
     * @param {Function} listener
     */
    removeListener(listener: any) {
      const self = this as any;
      self.listeners = self.listeners.filter((attached: any) => {
        if (attached === listener) {
          self.scrollBar.removeListener(listener)
        }

        return attached !== listener
      })
    },

    /**
     *
     */
    removeAllListeners() {
      const self = this as any;
      self.listeners.forEach((listener: any) => {
        self.scrollBar.removeListener(listener)
      })
      self.listeners = []
    },

    /**
     */
    update() {
      const self = this as any;
      self.scrollBar.update()
    },

    // Infinite loading api methods

    /**
     * Emits loading event
     */
    debounceLoad() {
      const self = this as any;
      _.debounce(function () {
        if (self.resolve) {
          self.resolve = false
          self.loading = true
          self.emitLoad()
        }
      }, 300);
    },


    /**
     * Emits loading event
     */
    emitLoad() {
      const self = this as any;
      self.$emit(Event.loading, {
        loaded: () => self.setLoaded(),
        completed: () => self.setCompleted(),
      })
    },

    /**
     * Sets loaded state
     */
    setLoaded() {
      const self = this as any;
      self.resolve = true
      self.loading = false
      self.completed = false

      self.$nextTick(() => {
        let limitY = self.getLimit("y")
        let offsetY = self.getOffset("y")

        if (_.checkLoadCapability(limitY, offsetY, self.loadThreshold)) {
          self.emitLoad()
        }
      })
    },

    /**
     * Sets completed state
     */
    setCompleted() {
      const self = this as any;
      self.resolve = false
      self.loading = false
      self.completed = true
    },

    /**
     * Resets state
     */
    resetInfLoad() {
      const self = this as any;
      self.resolve = true
      self.loading = false
      self.completed = false
    },

    // Misc
    focus() {
      const self = this as any;
      self.scrollBar.containerEl.focus()
    },
    blur() {
      const self = this as any;
      self.scrollBar.containerEl.blur()
    },
  },
  mounted() {
    const self = this as any;
    self.$nextTick(() => {
      // Use plugins
      if (self.hasPlugins) {
        self.plugins.forEach((plugin: any) => {
          SmoothScrollbar.use(plugin)
        })
      }

      // Init
      self.scrollBar = SmoothScrollbar.init(
        self.$refs.view,
        _.defaultsDeep(self.options, defaultOptions)
      )

      // 始终隐藏滚动条 qyk 2023.6.23
      if (this.hideScrollbar) {
        self.$el.getElementsByClassName('scrollbar-track')[0].style.visibility = "hidden";
        self.$el.getElementsByClassName('scrollbar-track')[1].style.visibility = "hidden";
      }

      // Add infinite loading listener
      self.addListener((status: any) => {
        if (!self.infiniteLoading) return
        if (self.loading || self.completed) return

        let { limit, offset } = status

        let canLoad = _.checkLoadCapability(
          limit.y,
          offset.y,
          self.loadThreshold
        )
        self.resolve = canLoad

        if (!self.completed) {
          if (canLoad) {
            // self.debounceLoad(true)  // qyk: "true" 参数不存在，原声明：debounceLoad: _.debounce(function () {...}, 300)
            self.debounceLoad();
          }
        } else {
          self.loading = false
        }
      })

      // Add scroll listener
      self.addListener((status: any) => {
        let { limit, offset } = status

        let limitX = limit.x
        let limitY = limit.y

        let offsetX = offset.x
        let offsetY = offset.y

        if (limitY > 0) {
          if (limitY === offsetY) {
            self.$emit(Event.endY)
          }
        }

        if (limitX > 0) {
          if (limitX === offsetX) {
            self.$emit(Event.endX)
          }
        }

        self.meta.limit = limit
        self.meta.offset = offset
        self.$emit(Event.scroll, status)
      })

      // Emit initial
      if (self.infiniteLoading) {
        self.emitLoad()
      }
    })
  },
  beforeUnmount() {
    const self = this as any;
    if (self.scrollBar !== null) {
      self.removeAllListeners()
      self.scrollBar.destroy()
    }
  },
  updated() {
    const self = this as any;
    self.scrollBar && self.scrollBar.update()
  },
  render() {
    const self = this as any;
    let containerData = {
      class: "c-scroll-view",
      ref: "view",
      attrs: {
        "data-scrollbar": "",
      },
      on: {
        mouseenter: self.focus,
      },
      style: {
        display: "block",
        width: "100%",
        height: "100%",
      },
    }

    return h("div", containerData, [
      h(
        "div",
        {
          class: "c-scroll-view__content",
          style: {
            position: "relative",
            display: "block",
            height: "auto",
          },
        },
        self.$slots.default()
      ),
    ])
  },
}
</script>
<style lang="scss" scoped>
:deep(.scrollbar-thumb) {
  width: 5px;
  background: rgb(0 0 0 / 10%);
}

:deep(.scrollbar-track) {
  background: transparent;
  width: 5px;
  // background: rgb(0 0 0 / 5%);
}
</style>
