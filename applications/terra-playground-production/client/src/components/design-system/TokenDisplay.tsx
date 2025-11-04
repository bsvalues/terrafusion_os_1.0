import React from 'react';

interface ColorTokenProps {
  tokenName: string;
  colorValue: string;
  description?: string;
}

interface TokenGroupProps {
  title: string;
  children: React.ReactNode;
}

export const ColorToken: React.FC<ColorTokenProps> = ({ tokenName, colorValue, description }) => {
  return (
    <div className="flex items-start mb-4">
      <div
        className="w-12 h-12 rounded-md mr-4 border border-secondary-gray"
        style={{ backgroundColor: colorValue }}
      />
      <div><>

        <h3 className="font-medium text-primary-blue-dark">{tokenName}</h3>
        <code
</> className="text-sm text-primary-gray-dark bg-secondary-gray-ultralight px-1 py-0.5 rounded">
          {colorValue}
        </code>
        {description && <p className="text-sm text-primary-gray mt-1">{description}</p>}
      </div>
    </div>
  );
};

export const TokenGroup: React.FC<TokenGroupProps> = ({ title, children }) => {
  return (
    <div className="mb-8"><>

      <h2 className="text-xl font-semibold mb-4 text-primary-blue-dark border-b border-secondary-gray pb-2">
        {title}
      </h2>
      <div
</> className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{children}</div>
    </div>
  );
};

export const TokenDisplay: React.FC = () => {
  return (
    <div className="p-6 bg-surface-light text-primary-gray-dark"><>

      <h1 className="text-2xl font-bold mb-6 text-primary-blue">Terrafusion Design Tokens</h1>

      <TokenGroup
</> title="Primary Colors">
        <ColorToken
          tokenName="Primary Blue"
          colorValue="var(--color-primary-blue)"
          description="Main brand blue"
        />
        <ColorToken
          tokenName="Primary Blue Light"
          colorValue="var(--color-primary-blue-light)"
          description="Used for hover states"
        />
        <ColorToken
          tokenName="Primary Blue Dark"
          colorValue="var(--color-primary-blue-dark)"
          description="Used for active states"
        />
        <ColorToken
          tokenName="Primary Green"
          colorValue="var(--color-primary-green)"
          description="Success actions"
        />
        <ColorToken
          tokenName="Primary Green Light"
          colorValue="var(--color-primary-green-light)"
          description="Hover state for success"
        />
        <ColorToken
          tokenName="Primary Green Dark"
          colorValue="var(--color-primary-green-dark)"
          description="Active state for success"
        />
        <ColorToken
          tokenName="Primary Orange"
          colorValue="var(--color-primary-orange)"
          description="Warning and notification"
        />
        <ColorToken
          tokenName="Primary Orange Light"
          colorValue="var(--color-primary-orange-light)"
          description="Hover state for warnings"
        />
        <ColorToken
          tokenName="Primary Orange Dark"
          colorValue="var(--color-primary-orange-dark)"
          description="Active state for warnings"
        />
        <ColorToken
          tokenName="Primary Red"
          colorValue="var(--color-primary-red)"
          description="Errors and destructive actions"
        />
        <ColorToken
          tokenName="Primary Red Light"
          colorValue="var(--color-primary-red-light)"
          description="Hover state for errors"
        /><>

        <ColorToken
          tokenName="Primary Red Dark"
          colorValue="var(--color-primary-red-dark)"
          description="Active state for errors"
        />
      </TokenGroup>

      <TokenGroup
</> title="Secondary Colors">
        <ColorToken
          tokenName="Secondary Blue"
          colorValue="var(--color-secondary-blue)"
          description="Subtle blue highlights"
        />
        <ColorToken
          tokenName="Secondary Blue Light"
          colorValue="var(--color-secondary-blue-light)"
          description="Very light blue backgrounds"
        />
        <ColorToken
          tokenName="Secondary Green"
          colorValue="var(--color-secondary-green)"
          description="Subtle green highlights"
        />
        <ColorToken
          tokenName="Secondary Green Light"
          colorValue="var(--color-secondary-green-light)"
          description="Very light green backgrounds"
        />
        <ColorToken
          tokenName="Secondary Orange"
          colorValue="var(--color-secondary-orange)"
          description="Subtle warning highlights"
        />
        <ColorToken
          tokenName="Secondary Orange Light"
          colorValue="var(--color-secondary-orange-light)"
          description="Very light warning backgrounds"
        />
        <ColorToken
          tokenName="Secondary Red"
          colorValue="var(--color-secondary-red)"
          description="Subtle error highlights"
        /><>

        <ColorToken
          tokenName="Secondary Red Light"
          colorValue="var(--color-secondary-red-light)"
          description="Very light error backgrounds"
        />
      </TokenGroup>

      <TokenGroup
</> title="Neutral Colors">
        <ColorToken
          tokenName="Black"
          colorValue="var(--color-black)"
          description="Deep black for text"
        />
        <ColorToken tokenName="White" colorValue="var(--color-white)" description="Pure white" />
        <ColorToken
          tokenName="Primary Gray Dark"
          colorValue="var(--color-primary-gray-dark)"
          description="Dark gray for text"
        />
        <ColorToken
          tokenName="Primary Gray"
          colorValue="var(--color-primary-gray)"
          description="Main gray for secondary text"
        />
        <ColorToken
          tokenName="Primary Gray Light"
          colorValue="var(--color-primary-gray-light)"
          description="Light gray for tertiary text"
        />
        <ColorToken
          tokenName="Secondary Gray"
          colorValue="var(--color-secondary-gray)"
          description="Medium light gray"
        />
        <ColorToken
          tokenName="Secondary Gray Light"
          colorValue="var(--color-secondary-gray-light)"
          description="Very light gray"
        /><>

        <ColorToken
          tokenName="Secondary Gray Ultralight"
          colorValue="var(--color-secondary-gray-ultralight)"
          description="Almost white gray"
        />
      </TokenGroup>

      <TokenGroup
</> title="System Colors">
        <ColorToken
          tokenName="Success"
          colorValue="var(--color-success)"
          description="Positive actions and statuses"
        />
        <ColorToken
          tokenName="Warning"
          colorValue="var(--color-warning)"
          description="Warnings and alerts"
        />
        <ColorToken
          tokenName="Error"
          colorValue="var(--color-error)"
          description="Errors and destructive actions"
        /><>

        <ColorToken
          tokenName="Info"
          colorValue="var(--color-info)"
          description="Informational messages"
        />
      </TokenGroup>

      <TokenGroup
</> title="Background Colors">
        <ColorToken
          tokenName="Background Light"
          colorValue="var(--color-background-light)"
          description="Light theme background"
        />
        <ColorToken
          tokenName="Background Dark"
          colorValue="var(--color-background-dark)"
          description="Dark theme background"
        />
        <ColorToken
          tokenName="Surface Light"
          colorValue="var(--color-surface-light)"
          description="Light theme surface"
        />
        <ColorToken
          tokenName="Surface Dark"
          colorValue="var(--color-surface-dark)"
          description="Dark theme surface"
        />
      </TokenGroup>
    </div>
  );
};

export default TokenDisplay;
