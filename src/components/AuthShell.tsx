import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { text } from '@/theme';
import { AppBar, Screen, Wordmark } from './Screen';

type Props = { title: string; sub: string; children: ReactNode; footer?: ReactNode; back?: boolean };

/** screens-onboarding.jsx AuthShell — wordmark (or back button), title, subtitle, fields, footer line. */
export function AuthShell({ title, sub, children, footer, back }: Props) {
  return (
    <Screen header={back ? <AppBar /> : undefined} footer={footer ? <View style={{ alignItems: 'center' }}>{footer}</View> : undefined}>
      {!back && (
        <View style={{ paddingTop: 28, paddingHorizontal: 24 }}>
          <Wordmark size={36} />
        </View>
      )}
      <View style={{ paddingTop: 22, paddingHorizontal: 24 }}>
        <Text style={text.h1}>{title}</Text>
        <Text style={[text.body, { fontSize: 14, lineHeight: 21, marginTop: 8 }]}>{sub}</Text>
        <View style={{ gap: 16, marginTop: 26 }}>{children}</View>
      </View>
    </Screen>
  );
}
