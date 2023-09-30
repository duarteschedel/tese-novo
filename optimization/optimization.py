import numpy as np
from scipy.optimize import minimize

# Define the objective function to be maximized


def objective(x, *args):
    n = len(args) // 2
    if len(x) != 5 * n:
        raise ValueError(
            "The number of variables (xi) must be 5 times the number of subexpressions.")

    result = 0
    for i in range(n):
        vi = args[2 * i]     # Get the v value for the i-th subexpression
        hi = args[2 * i + 1]  # Get the h value for the i-th subexpression

        subexpression = (x[5*i] - x[5*i+1] + x[5*i+2] -
                         x[5*i+3]) * vi + x[5*i+4] * hi
        result += subexpression

    return -result  # Negate the result to convert maximization to minimization

# Define the constraint function


n_subexpressions = 4  # Change this to the number of subexpressions in your function
p_max_bat = 2000
p_max_hydr = 2000
PV = [1000, 1000, 1000, 1000]


def constraint(x):
    # n = len(x) // n_subexpressions
    constraints_list = []
    # xn > 0
    for i in range(len(x)):
        constraints_list.append(x[i])

    constraints_list.append((-x[0] - 1))
    constraints_list.append((-x[4] - 1))

    # Restringir (Xn - Xn+1) + (Xn-5 - Xn-5+1) < 0  --> Certtificar que Xn nao excede a energia disponivel na bateria
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression - x[j*5]+x[j*5+1]
        constraints_list.append(expression)

    # Restringir (Xn+1 - Xn) + (Xn-5+1 - Xn-5) ... < P_max Bateria
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + x[j*5]-x[j*5+1]
        expression = expression + p_max_bat
        constraints_list.append(expression)

    # Certificar que o Pch_el é menor que a P-max que se pode armazenar de Hydrogen
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression - x[j*5+3]+x[j*5+4]
        expression = expression + p_max_hydr
        constraints_list.append(expression)

    # Certificar que nao se vende mais hydrogen do que aquele que sem tem
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression - x[j*5+4]+x[j*5+3]
        constraints_list.append(expression)

    # # Certificar que x0-x1+x2-x3 ... < PV
    # for i in range(n_subexpressions):
    #     expression = 0
    #     for j in range(i+1):
    #         expression = expression - x[j*5]+x[j*5+1]-x[j*5+2]+x[j*5+3] + PV[i]
    #     constraints_list.append(expression)

    # Pch + Ppv + Pdis < PV
    # for i in range(n_subexpressions):
    #     expression = -x[i*5+1] - x[i*5+2] - x[i*5+2] + PV[i]
    #     constraints_list.append(expression)

    # Pch - Pdis + Ppv + Pch_el - Pdis_el < PV
    for i in range(n_subexpressions):
        expression = -x[i*5+1] + x[i*5] - \
            x[i*5+2] - x[i*5+3] + x[i*5+4] + PV[i]
        constraints_list.append(expression)

    # Pch < PV
    for i in range(n_subexpressions):
        expression = -x[i*5+1] + PV[i]
        constraints_list.append(expression)

    # Pch_el < PV
    for i in range(n_subexpressions):
        expression = -x[i*5+3] + PV[i]
        constraints_list.append(expression)

    # P_pv < PV
    for i in range(n_subexpressions):
        expression = -x[i*5+2] + PV[i]
        constraints_list.append(expression)

    # P_ch + P_ch_el < PV
    # for i in range(n_subexpressions):
    #     expression = -x[i*5+3] - x[i*5+1] + PV[i]
    #     constraints_list.append(expression)

    constraints = np.array(constraints_list)
    # constraints = np.zeros(2 * (n - 5))
    # for i in range(n - 5):
    #     # Xn - Xn+1 + Xn-5 - Xn-5+1 < 0
    #     constraints[i] = (x[i] - x[i + 1]) + (x[i + 5] - x[i + 6])
    #     # -(Xn - Xn+1) - (Xn-5 - Xn-5+1) - 2000 < 0
    #     constraints[i + n - 5] = -(x[i] - x[i + 1]) - \
    #         (x[i + 5] - x[i + 6]) - 2000

    return constraints  # Add xn > 0 and other constraints


# Define the initial guess
x0 = np.ones(5 * n_subexpressions) / \
    (5 * n_subexpressions)  # Initial guess for all xi

# Define the constants vi and hi for each subexpression
# Adjust this list to your specific v values for each subexpression
v_values = [2, 30000, 1, 7]
# Adjust this list to your specific h values for each subexpression
h_values = [4, 5000, 2000, 6000]

# Define the constraint bounds (if any)
# Lower bound of 0 for all xi
bounds = [(0, None) for _ in range(5 * n_subexpressions)]

# Define the constraint dictionary (if any)
constraint_dict = {'type': 'ineq', 'fun': constraint}

# Perform the optimization
result = minimize(objective, x0, args=tuple(v_values + h_values),
                  constraints=constraint_dict, bounds=bounds)

# Print the optimization result
print("Optimization Result:")
print(result)

# Extract the optimized solution
x_opt = result.x

formatted_numbers = ["{:.0f}".format(num) for num in x_opt]
for formatted_num in formatted_numbers:
    print(formatted_num)


# Print the optimized solution
print("\nOptimized Solution:")
print("x_opt =", x_opt)
print("Objective value (maximized) =", -result.fun)

for i in range(0, len(x_opt), 5):
    delta_bat_power = x_opt[i+1] - x_opt[i]
    pv_value = x_opt[i+2]
    delta_hydr = x_opt[i+3] - x_opt[i+4]

    formatted_delta_bat_power = "{:.0f}".format(delta_bat_power)
    formatted_pv_value = "{:.0f}".format(pv_value)
    formatted_delta_hydr = "{:.0f}".format(delta_hydr)

    print('delta_bat_power ', formatted_delta_bat_power)
    print('PV ', formatted_pv_value)
    print('delta_hydr ', formatted_delta_hydr)
