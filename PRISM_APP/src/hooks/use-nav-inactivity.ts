import { useEffect, useRef, useState } from "react";
import { Animated, PanResponder } from "react-native";

export function useNavInactivity(timeout: number = 3000) {
  const [visible, setVisible] = useState(true);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const timer = useRef<NodeJS.Timeout | null>(null);

  const showNav = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    resetTimer();
  };

  const hideNav = () => {
    setVisible(false);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 100,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(hideNav, timeout);
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        showNav();
        return false;
      },
      onMoveShouldSetPanResponderCapture: () => {
        showNav();
        return false;
      },
    })
  ).current;

  return { panResponder, navStyle: { opacity, transform: [{ translateY }] } };
}
