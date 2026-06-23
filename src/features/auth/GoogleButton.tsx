import { useGoogleLogin } from '@react-oauth/google'
import { Button } from '@/design-system'

export function GoogleButton({ onToken, disabled }: { onToken: (accessToken: string) => void; disabled?: boolean }) {
  const login = useGoogleLogin({
    flow: 'implicit',
    scope: 'openid email profile',
    onSuccess: (resp) => onToken(resp.access_token),
  })
  return (
    <Button type="button" variant="ghost" disabled={disabled} onClick={() => login()} className="w-full">
      Iniciar con Google
    </Button>
  )
}
