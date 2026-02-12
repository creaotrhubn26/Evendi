/**
 * EventTypeIcon — Renders an event type icon as either a custom image or a Feather icon.
 *
 * If the admin has set a custom image for this event type, renders an <Image>.
 * Otherwise renders an <EvendiIcon> with the mapped Feather icon name.
 */
import React from "react";
import { Image, View } from "react-native";
import { EvendiIcon } from "@/components/EvendiIcon";
import type { EventType } from "@shared/event-types";
import { getEventTypeIcon, getEventTypeColor, getEventTypeImage } from "@/lib/event-type-icons";

interface Props {
  type: EventType;
  size?: number;
  customIcons?: Record<string, string>;
  customColors?: Record<string, string>;
}

export function EventTypeIcon({ type, size = 32, customIcons, customColors }: Props) {
  const image = getEventTypeImage(type, customIcons);
  const color = getEventTypeColor(type, customColors);

  if (image) {
    return (
      <Image
        source={image}
        style={{ width: size, height: size, borderRadius: size * 0.2 }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.2,
        backgroundColor: color + "20",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <EvendiIcon name={getEventTypeIcon(type)} size={size * 0.55} color={color} />
    </View>
  );
}
