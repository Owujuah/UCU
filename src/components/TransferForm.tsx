import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUserId, getUserById } from '../utils/authUtils';
import { updateUser, addTransaction, formatCurrency } from '../utils/storageUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TransferForm = ({ onTransferComplete }: { onTransferComplete: () => void }) => {
  const [receiverName, setReceiverName] = useState('');
  const [receiverAccount, setReceiverAccount] = useState('');
  const [receiverTransit, setReceiverTransit] = useState(''); // New field
  const [receiverBank, setReceiverBank] = useState('');       // New field
  const [amount, setAmount] = useState('');
  const [formattedAmount, setFormattedAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const { toast } = useToast();

  // Load user balance when the component mounts
  useEffect(() => {
    const loadUserBalance = async () => {
      const userId = await getCurrentUserId();
      if (userId) {
        const user = await getUserById(userId);
        if (user) {
          setBalance(user.balance);
        }
      }
    };
    loadUserBalance();
  }, []);

  // Handle amount change and display formatted currency
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    const parts = value.split('.');
    const formattedValue = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join('')}` : value;
    setAmount(formattedValue);

    const numValue = parseFloat(formattedValue);
    if (!isNaN(numValue)) {
      setFormattedAmount(formatCurrency(numValue));
    } else {
      setFormattedAmount('');
    }
  };

  // Handle the transfer process
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    const userId = await getCurrentUserId();
    if (!userId) {
      toast({
        title: "Authentication Error",
        description: "You need to be logged in to make transfers.",
        variant: "destructive"
      });
      return;
    }

    const user = await getUserById(userId);
    if (!user) {
      toast({
        title: "User Error",
        description: "Could not find user information.",
        variant: "destructive"
      });
      return;
    }

    // Validate all fields
    if (!receiverName || !receiverAccount || !receiverTransit || !receiverBank || !amount) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({
        title: "Amount Error",
        description: "Please enter a valid amount.",
        variant: "destructive"
      });
      return;
    }

    if (parsedAmount > user.balance) {
      toast({
        title: "Insufficient Funds",
        description: "You don't have enough balance for this transfer.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Simulate server processing delay
    setTimeout(async () => {
      try {
        // Update user's balance
        const updatedUser = {
          ...user,
          balance: user.balance - parsedAmount
        };
        await updateUser(updatedUser);

        // Create a transaction record with new fields
        const transaction = {
          id: uuidv4(),
          senderId: userId,
          receiverName,
          receiverAccount,
          receiverTransit,   // New field
          receiverBank,      // New field
          amount: parsedAmount,
          date: new Date().toISOString(),
          type: 'transfer' as const
        };
        await addTransaction(transaction);

        // Reset the form
        setReceiverName('');
        setReceiverAccount('');
        setReceiverTransit('');
        setReceiverBank('');
        setAmount('');
        setFormattedAmount('');
        setBalance(updatedUser.balance);

        toast({
          title: "Transfer Successful",
          description: `You have transferred ${formatCurrency(parsedAmount)}.`,
          variant: "default"
        });

        onTransferComplete();
      } catch (error) {
        console.error('Transfer error:', error);
        toast({
          title: "Transfer Failed",
          description: "An error occurred during the transfer.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    }, 1500);
  };

  return (
    <form onSubmit={handleTransfer} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="receiverName">Recipient Account Name</Label>
        <Input
          id="receiverName"
          placeholder="John Doe"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiverAccount">Account Number</Label>
        <Input
          id="receiverAccount"
          placeholder="1234 5678 9012 3456"
          value={receiverAccount}
          onChange={(e) => setReceiverAccount(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiverTransit">Branch Transit Number</Label>
        <Input
          id="receiverTransit"
          placeholder="12345"
          value={receiverTransit}
          onChange={(e) => setReceiverTransit(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receiverBank">Bank Name</Label>
        <Input
          id="receiverBank"
          placeholder="Bank of America"
          value={receiverBank}
          onChange={(e) => setReceiverBank(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <div className="relative">
          <Input
            id="amount"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
            disabled={isLoading}
            className="w-full pl-6"
          />
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            $
          </div>
          {formattedAmount && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
              {formattedAmount}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Available Balance: {formatCurrency(balance)}
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Transfer Funds"}
      </Button>
    </form>
  );
};

export default TransferForm;