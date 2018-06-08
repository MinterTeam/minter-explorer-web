<script>
    import {shortFilter} from "~/assets/utils";

    export default {
        props: {
            linkText: {
                type: String|Number,
                required: true,
            },
            linkPath: {
                type: String,
                required: true,
            },
            isNotLink: {
                type: Boolean,
                default: false,
            },
        },
        computed: {
            shortText() {
                return shortFilter(this.linkText);
            },
            isLong() {
                return this.linkText !== this.shortText;
            }
        },
        render(createElement) {
            return createElement(
                this.isNotLink ? 'div' : 'nuxt-link',
                {
                    class: {
                        'table__cell-overflow--middle': this.isLong,
                        'link--default': !this.isNotLink,
                    },
                    props: this.isNotLink ? {} : {
                        to: this.linkPath,
                    }
                },
                [
                    this.shortText,
                ]
            )
        }
    }
</script>
