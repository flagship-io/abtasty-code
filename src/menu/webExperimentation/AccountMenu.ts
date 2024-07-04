import * as vscode from 'vscode';
import { AccountItem } from '../../providers/webExperimentation/AccountList';
import { AuthenticationStore } from '../../store/webExperimentation/AuthenticationStore';

export async function selectAccountInputBox(account: AccountItem, authenticationStore: AuthenticationStore) {
  const picked = await vscode.window.showQuickPick(['yes', 'no'], {
    title: `Select the account ${account.label}, id: ${account.id}`,
    placeHolder: 'Do you confirm ?',
    ignoreFocusOut: true,
  });
  if (picked === 'yes') {
    await authenticationStore.selectAccount(account.id!);
    return;
  }
  return;
}
