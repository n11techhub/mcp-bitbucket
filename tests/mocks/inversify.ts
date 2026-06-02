type Constructor<T = any> = new (...args: any[]) => T;

type Binding<T> = {
    to: (impl: Constructor<T>) => Binding<T>;
    toConstantValue: (value: T) => void;
    inSingletonScope: () => Binding<T>;
};

export class Container {
    private readonly values = new Map<any, any>();
    private readonly factories = new Map<any, () => any>();

    bind<T>(key: any): Binding<T> {
        const binding: Binding<T> = {
            to: (impl: Constructor<T>) => {
                this.factories.set(key, () => new impl());
                return binding;
            },
            toConstantValue: (value: T) => {
                this.values.set(key, value);
            },
            inSingletonScope: () => binding,
        };
        return binding;
    }

    get<T>(key: any): T {
        if (this.values.has(key)) {
            return this.values.get(key) as T;
        }
        const factory = this.factories.get(key);
        if (!factory) {
            throw new Error(`No binding found for key: ${String(key)}`);
        }
        const value = factory();
        this.values.set(key, value);
        return value as T;
    }
}

export function injectable(): ClassDecorator {
    return () => undefined;
}

export function inject(_token: unknown): ParameterDecorator {
    return () => undefined;
}

