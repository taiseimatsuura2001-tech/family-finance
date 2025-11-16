import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>メールを確認してください</CardTitle>
          <CardDescription>
            ログインリンクをメールで送信しました
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                📧 メールボックスを確認して、ログインリンクをクリックしてください。
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>メールが届かない場合：</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>迷惑メールフォルダを確認してください</li>
                <li>数分待ってから再度お試しください</li>
                <li>メールアドレスが正しいか確認してください</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
