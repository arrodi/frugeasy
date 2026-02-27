import { ReactNode, memo, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleProp, View, ViewStyle } from 'react-native';

type SwipeRevealRowProps = {
  id: string;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  revealWidth?: number;
  shellStyle?: StyleProp<ViewStyle>;
  actionsBackgroundStyle?: StyleProp<ViewStyle>;
  actionsRailStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  actions: (opened: boolean) => ReactNode;
  children: ReactNode;
};

function SwipeRevealRowImpl({
  id,
  activeId,
  setActiveId,
  revealWidth = 120,
  shellStyle,
  actionsBackgroundStyle,
  actionsRailStyle,
  contentStyle,
  actions,
  children,
}: SwipeRevealRowProps) {
  const reveal = useRef(new Animated.Value(0)).current;
  const opened = activeId === id;
  const actionOpacity = reveal.interpolate({ inputRange: [0, 24, revealWidth], outputRange: [0, 0.2, 1] });

  useEffect(() => {
    Animated.timing(reveal, { toValue: opened ? revealWidth : 0, duration: 180, useNativeDriver: false }).start();
  }, [opened, reveal, revealWidth]);

  return (
    <Pressable style={shellStyle} onPress={() => setActiveId(opened ? null : id)}>
      <View style={actionsBackgroundStyle} pointerEvents="box-none">
        <Animated.View style={[actionsRailStyle, { width: reveal, opacity: actionOpacity }]}>{actions(opened)}</Animated.View>
      </View>
      <Animated.View style={[contentStyle, { marginRight: reveal }]}>{children}</Animated.View>
    </Pressable>
  );
}

export const SwipeRevealRow = memo(SwipeRevealRowImpl);
