<script>

    export default {
        layout: 'default',
        props: ['error'],
    };
</script>

<template>
    <div class="u-text-center">
        <h1 class="u-h1--xl error__title">Error {{ error.statusCode }}</h1>
        <p v-if="error.statusCode === 504">Request failed with status code 504. <br> Gateway time-out.</p>
        <p v-else-if="error.statusCode === 503">The webpage is currently unavailable. <br> It may be overloaded or down for maintenance.</p>
        <p v-else>{{ error.message }}</p>
        <!--<p v-if="error.statusCode === 404">К сожалению, здесь ничего нет. Проверьте правильность адреса или просто перейдите на главную страницу нашего журнала.</p>-->
        <!--<p v-else-if="error.message === 'Auth error'">Ошибка авторизации</p>-->
        <!--<p v-else-if="error.message === 'Network Error'">Сетевая ошибка</p>-->
        <!--<p v-else>Что-то пошло не так</p>-->
        <p>
            <a class="button button--main" href="/">Return to main page</a>
        </p>
    </div>

</template>
