<script>
export default {
    asyncData({ params, query, redirect }) {
        return redirect({
            name: 'validators-pubKey',
            query,
            params,
        });
    },
};
</script>

<template>
    <section class="panel u-section">
        <h1 class="u-h2">Redirecting…</h1>
    </section>
</template>
