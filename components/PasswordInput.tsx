// Champ mot de passe avec bouton « œil » pour afficher / masquer la saisie.
import { Eye, EyeOff } from 'lucide-react-native'
import { type ComponentRef, type Ref, useState } from 'react'
import { Pressable, StyleSheet, TextInput, type TextInputProps, View } from 'react-native'

const BLUE = '#0f3b82'

type Props = TextInputProps & { inputRef?: Ref<ComponentRef<typeof TextInput>> }

export default function PasswordInput({ inputRef, style, ...rest }: Props) {
  const [visible, setVisible] = useState(false)
  return (
    <View style={S.wrap}>
      <TextInput
        {...rest}
        ref={inputRef}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        style={[S.input, style]}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        style={S.eye}
      >
        {visible ? <EyeOff color={BLUE} size={20} /> : <Eye color={BLUE} size={20} />}
      </Pressable>
    </View>
  )
}

const S = StyleSheet.create({
  wrap: { justifyContent: 'center' },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12,
    paddingLeft: 12, paddingRight: 44, paddingVertical: 10, color: '#0b1f44',
  },
  eye: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center' },
})
