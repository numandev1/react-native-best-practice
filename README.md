<div align="center">
 <img height="150" src="/media/logo.png" />
</div>
 
<br/>

<div align="center">

[![GitHub Repo stars](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#Installation)
[![GitHub Repo stars](https://img.shields.io/badge/Expo-1B1F23?style=for-the-badge&logo=expo&logoColor=white)](#managed-expo)
[![GitHub Repo stars](https://img.shields.io/static/v1?style=for-the-badge&message=Discord&color=5865F2&logo=Discord&logoColor=FFFFFF&label=)](https://discord.gg/5XCGcTTazY)
[![GitHub Repo stars](https://img.shields.io/github/stars/numandev1/react-native-best-practice?style=for-the-badge&logo=github)](https://github.com/numandev1/react-native-best-practice/stargazers)
![npm](https://img.shields.io/npm/dt/react-native-best-practice?style=for-the-badge)

</div>

**REACT-NATIVE-BEST-PRACTICE** is a react-native best practice and a package, which provides techniques for increasing performance as well as utilities for increasing the performance of the app

## Table of Contents

- [Why-Did-You-Render (avoid extra rerendering)](#why-did-you-render-avoid-extra-rerendering)
- [Memoization in React](#memoization-in-react)
  - [Pure Components](#pure-components)
  - [Reference equality](#reference-equality)
  - [React](#react)
  - [Examples](#examples)
  - [react-native-performance](#react-native-performance)
  - [Disclaimer](#react-native-performance)
  - [Conclusion](#conclusion)

# Why-Did-You-Render (avoid extra rerendering)

you should use [why-did-you-render](https://github.com/welldone-software/why-did-you-render) which notify you about potentially avoidable re-renders.

```ts
import React from 'react';

const useWDYR = __DEV__;

if (useWDYR) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    // Enable tracking in all pure components by default
    trackAllPureComponents: true,
    trackHooks: true,

    include: [
      // Uncomment to enable tracking in all components. Must also uncomment /^Screen/ in exclude.
      // /.*/,
      // Uncomment to enable tracking by displayName, e.g.:
      // /^Components/,
    ],

    exclude: [
      // Uncomment to enable tracking in all components
      // /^Components/,
    ],
  });
}
```

import above file code into your app root `index.js`

# Memoization in React

<div align="center">
<blockquote>
  <a href="https://react.dev/reference/react/memo"><i>lets you skip re-rendering a component when its props are unchanged.</i></a>
</blockquote>
</div>

It's important to memoize heavy computations as well as arrays and object creations so that they don't get re-created on every render. A re-render occurs when state changes, redux dispatches some action, or when the user types into a text input (re-render for every single key press). You don't want to run a lot of operations in those renders for very obvious reasons - so no heavy filtering, no list operations, etc.

## Pure Components

A [Pure Component](https://reactjs.org/docs/react-api.html#reactpurecomponent) (or a `React.memo` component) does not re-render if it's props are _shallow equal_.

Each variable you create in your render function will get re-allocated on each render. While this is not a problem for **value types**, this causes **reference types** to be different on every render. When you pass those variables down to **pure components** via props, they will still re-render even though the props are logically the same. Often those variables even go over the Bridge and make your app slow.

## Reference equality

When a pure component re-renders, it compares the previous props to the current props and checks if they are _shallow-equal_.

### Value types

**Numbers**, **strings** and **booleans** are **value types**, which means they can be _compared by value_:

```js
const i1 = 7;
const i2 = 7;
const equal = i1 === i2; // true
```

### Reference types

**Objects**, **arrays** and **functions** are **reference types**, which means they cannot be compared by their logical value, but have to be _compared by reference_:

```js
const o1 = { x: 7 };
const o2 = { x: 7 };
const equal = o1 === o2; // false
```

Reference comparisons simply compare the memory address of the variable, so only `o1 === o1` would be `true` in the above code example.

> There are libraries like [deep-equal](https://github.com/inspect-js/node-deep-equal) to compare objects by actual equality, but that's not _shallow equality_ anymore.

### React

If you create objects in your render function, they will be re-created on every single render. This means when you create an object in the first render, it is not _reference-equal_ to the object in the second render. For this very reason, memoization exists.

- Use the `useMemo` hook to memoize arrays and objects which will keep their reference equality (and won't get re-created on each render) as long as the dependencies (second argument) stay the same. Also use `useMemo` to cache heavy computations, such as array operations, filtering, etc.
- Use the `useCallback` hook to memoize a function.

In general, function components can be optimized more easily due to the concept of [hooks](https://reactjs.org/docs/hooks-overview.html). You can however apply similar techniques for class components, just be aware that this will result in a lot more code.

### React Native

While animations and performance intensive tasks are scheduled on native threads, your entire business logic runs on a single JavaScript thread, so make sure you're doing as little work as possible there. Doing too much work on the JavaScript thread can be compared to a high ping in a video game - you can still look around smoothly, but you can't really play the game because every interaction takes too long.

Native components (`<View>`, `<Text>`, `<Image>`, `<Blurhash>`, ...) have to pass props to native via the bridge. They can be memoized, so React compares the props for _shallow-equality_ and only passes them over the bridge if they are different than the props from the last render. If you don't memoize correctly, you might up passing props over the bridge for every single render, causing the bridge to be very occupied. See the [Styles](#styles) example - styles will get sent over the bridge on every re-render!

Here are a few examples to help you avoid doing too much work on your JavaScript thread:

# Examples

## Styles

### Bad

```jsx
return <View style={[styles.container, { backgroundColor: 'red' }]} />;
```

### Good

```jsx
const style = useMemo(() => [styles.container, { backgroundColor: 'red' }], []);
return <View style={style} />;
```

### Exceptions

- Reanimated styles from `useAnimatedStyle`, as those have to be dynamic.

## Arrays

Using `filter`, `map` or other array operations in renderers will run the entire operation again for every render.

### Bad

```jsx
return (
  <Text>{users.filter((u) => u.status === 'online').length} users online</Text>
);
```

### Good

```jsx
const onlineCount = useMemo(
  () => users.filter((u) => u.status === 'online').length,
  [users]
);
return <Text>{onlineCount} users online</Text>;
```

You can also apply this to render multiple React views with `.map`. Those can be memoized with `useMemo` too.

## Functions

### Bad

```jsx
return <View onLayout={(layout) => console.log(layout)} />;
```

### Good

```jsx
const onLayout = useCallback((layout) => {
  console.log(layout);
}, []);
return <View onLayout={onLayout} />;
```

Make sure to also think about other calls in the renderer, e.g. `useSelector`, `useComponentDidAppear` - wrap the callback there too!

## Forward-propagating Functions

### Bad

```jsx
function MyComponent(props) {
  return <PressableOpacity onPress={() => props.logoutUser()} />;
}
```

### Good

```jsx
function MyComponent(props) {
  return <PressableOpacity onPress={props.logoutUser} />;
}
```

## Objects

### Bad

```jsx
function MyComponent(props) {
  return (
    <RecyclerListView scrollViewProps={{ horizontal: props.isHorizontal }} />
  );
}
```

### Good

```jsx
function MyComponent(props) {
  const scrollViewProps = useMemo(
    () => ({
      horizontal: props.isHorizontal,
    }),
    [props.isHorizontal]
  );
  return <RecyclerListView scrollViewProps={scrollViewProps} />;
}
```

## Lift out of render

### Bad

```jsx
function MyComponent() {
  return <RecyclerListView scrollViewProps={{ horizontal: true }} />;
}
```

### Good

```jsx
const SCROLL_VIEW_PROPS = { horizontal: true };

function MyComponent() {
  return <RecyclerListView scrollViewProps={SCROLL_VIEW_PROPS} />;
}
```

This applies to objects as well as functions which don't depend on the component's state or props. Always use this if you can, since it's even more efficient than `useMemo` and `useCallback`.

## Initial States

### Bad

```jsx
const [me, setMe] = useState(users.find((u) => u.id === myUserId));
```

### Good

```jsx
const [me, setMe] = useState(() => users.find((u) => u.id === myUserId));
```

[The `useState` hook accepts an initializer function](https://reactjs.org/docs/hooks-reference.html#lazy-initial-state). While the first example ("Bad") runs the `.find` on every render, the second example only runs the passed function once to initialize the state.

## Count re-renders

When writing new components I always put a log statement in my render function to passively watch how often my component re-renders while I'm working on it. In general, components should re-render as little as possible, and if I see a lot of logs appearing in my console I know I did something wrong. It's a good pactice to put this function in your component once you start working on it, and remove it once done.

```jsx
function ComponentImWorkingOn() {
  // code
  console.log('re-rendering ComponentImWorkingOn!');
  return <View />;
}
```

You can also use the [why-did-you-render](https://github.com/welldone-software/why-did-you-render) library to find out _why_ a component has re-rendered (prop changes, state changes, ...) and possibly catch mistakes early on.

## `React.memo`

### Bad

```jsx
export const MyComponent = (props) => {
  return ...
}
```

### Good

```jsx
const MyComponentImpl = (props) => {
  return ...
}

export const MyComponent = React.memo(MyComponentImpl);
```

If your component renders the same result given the same props, you can wrap it in a call to `React.memo(...)` for a performance boost in some cases by memoizing the result. This means that React will skip rendering the component, and reuse the last rendered result. See [the official docs for `React.memo`](https://reactjs.org/docs/react-api.html#reactmemo), and [use `React.memo(...)` wisely](https://dmitripavlutin.com/use-react-memo-wisely/).

## react-native-performance

If your app feels slow, try the [react-native-performance](https://github.com/oblador/react-native-performance) library and it's flipper plugin to profile your app's performance in various aspects such as _time to interactive_, _component render time_, _script execution_ and more.

# Disclaimer

Don't prematurely optimize. Some examples used here (e.g. the `useMemo` one) are very small and only demonstrate the idea. A hook like `useMemo also comes with a cost (allocating the function and the deps array, calling the actual hook and running an array comparison), so keep in mind that it is often better to just pass in objects or arrays directly if the component itself is optimized. After a certain component complexity or with a certain dependency graph, memoizing functions can be a huge performance win, but there are also cases where it just leads to unnecessarily complex code and sometimes even worse performance.
Always benchmark before and after!

# Conclusion

<h4 align="center">memoize!!</h5>
