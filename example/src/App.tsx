import * as React from 'react';

import { StyleSheet, View, Text } from 'react-native';
import { useDeepEffect } from 'react-native-best-pactice';

export default function App() {
  const [result] = React.useState({
    name: 'test',
  });

  useDeepEffect(() => {
    console.log('result changed');
  }, [result]);

  return (
    <View style={styles.container}>
      <Text>Result: {result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
