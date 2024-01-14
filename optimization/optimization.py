import numpy as np
from scipy.optimize import minimize
from flask import Flask, jsonify, request

# Define api

app = Flask(__name__)


# Define the objective function to be maximized


def objective(x, *args):
    n = len(args) // 2

    if len(x) != 4 * n:
        raise ValueError(
            "The number of variables (xi) must be 4 times the number of subexpressions.")

    result = 0
    for i in range(n):
        vi = args[i]     # Get the v value for the i-th subexpression
        hi = args[i + 4]  # Get the h value for the i-th subexpression

        subexpression = (PV[i] - x[4*i] + x[4*i+1] -
                         x[4*i+2]) * vi + x[4*i+3] * hi
        result += subexpression

    return -result  # Negate the result to convert maximization to minimization

# Define the constraint function


n_subexpressions = 4  # Change this to the number of subexpressions in your function
p_max_bat = 100
p_max_hydr = 20
PV = [20, 13, 1, 10]


def constraint(x):
    # n = len(x) // n_subexpressions
    constraints_list = []
    # xn > 0
    for i in range(len(x)):
        constraints_list.append(x[i])

  

    # # Restringir (Xn - Xn+1) + (Xn-5 - Xn-5+1) < 0  --> Certtificar que Xn nao excede a energia disponivel na bateria
    # for i in range(n_subexpressions):
    #     expression = 0
    #     for j in range(i+1):
    #         expression = expression - x[j*5]+x[j*5+1]
    #     constraints_list.append(expression)

    # # Restringir (Xn+1 - Xn) + (Xn-5+1 - Xn-5) ... < P_max Bateria
    # for i in range(n_subexpressions):
    #     expression = 0
    #     for j in range(i+1):
    #         expression = expression + x[j*5]-x[j*5+1]
    #     expression = expression + p_max_bat
    #     constraints_list.append(expression)

    # # Certificar que o Pch_el é menor que a P-max que se pode armazenar de Hydrogen
    # for i in range(n_subexpressions):
    #     expression = 0
    #     for j in range(i+1):
    #         expression = expression - x[j*5+3]+x[j*5+4]
    #     expression = expression + p_max_hydr
    #     constraints_list.append(expression)

    # # Certificar que nao se vende mais hydrogen do que aquele que sem tem
    # for i in range(n_subexpressions):
    #     expression = 0
    #     for j in range(i+1):
    #         expression = expression - x[j*5+4]+x[j*5+3]
    #     constraints_list.append(expression)

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

    # # Pch - Pdis + Ppv + Pch_el - Pdis_el < PV
    # for i in range(n_subexpressions):
    #     expression = -x[i*5+1] + x[i*5+2] - \
    #         x[i*5+2] - x[i*5+3] + x[i*5+4] + PV[i]
    #     constraints_list.append(expression)

    

    # # P_pv < PV
    # for i in range(n_subexpressions):
    #     expression = -x[i*5+2] + PV[i]
    #     constraints_list.append(expression)
    # ------------------------------------------
    # PV - x0 + x1 - x2 > 0 | PV - Pch + Pdis - Pch_el > 0
    for i in range(n_subexpressions):
        expression = PV[i] - x[i*4] + \
            x[i*4+1] - x[i*4+2]
        constraints_list.append(expression)
    
    # (x1 - x0) + (x5 - x4) + Pmax > 0 | (Pch0 - Pdis0) + (Pch1 - Pdis1) < Pmax | Certificar que o Pch é menor que a P-max que se pode armazenar de energia na bateria
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + x[j*4+1]-x[j*4]
        expression = expression + p_max_bat
        constraints_list.append(expression)
    
    # (x0 - x1) + (x4 - x5) > 0 | (Pch0 - Pdis0) + (Pch1 - Pdis1) > 0 | Certificar que nao se vende mais energia do que aquele que sem tem
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + x[j*4]-x[j*4+1]
        constraints_list.append(expression)
    
    # (x3 - x2) + (x7 - x6) + Pmax_el > 0 | (Pch0_el - Pdis0_el) + (Pch1_el - Pdis1_el) < Pmax_el | Certificar que o Pch_el é menor que a P-max que se pode armazenar de Hydrogen
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + x[j*4+3]-x[j*4+2]
        expression = expression + p_max_hydr
        constraints_list.append(expression)
    
    # (x2 - x3) + (x6 - x7) > 0 | (Pch0_el - Pdis0_el) + (Pch1_el - Pdis1_el) > 0 | Certificar que nao se vende mais hydrogen do que aquele que sem tem
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + x[j*4+2]-x[j*4+3]
        constraints_list.append(expression)
    
    # Pch < PV
    for i in range(n_subexpressions):
        expression = -x[i*4] + PV[i]
        constraints_list.append(expression)

    # Pch_el < PV
    for i in range(n_subexpressions):
        expression = -x[i*4+2] + PV[i]
        constraints_list.append(expression)

    constraints = np.array(constraints_list)
    # constraints = np.zeros(2 * (n - 5))
    # for i in range(n - 5):
    #     # Xn - Xn+1 + Xn-5 - Xn-5+1 < 0
    #     constraints[i] = (x[i] - x[i + 1]) + (x[i + 5] - x[i + 6])
    #     # -(Xn - Xn+1) - (Xn-5 - Xn-5+1) - 2000 < 0
    #     constraints[i + n - 5] = -(x[i] - x[i + 1]) - \
    #         (x[i + 5] - x[i + 6]) - 2000

    return constraints  # Add xn > 0 and other constraints





@app.route('/optimize', methods=['POST'])
def optimize():
    try:
        data = request.get_json()

        # Extract v_values, h_values, and PV from the request data
        v_values = data.get('v_values', [])
        h_values = data.get('h_values', [])
        PV = data.get('PV', [])

        # Ensure the lengths of v_values, h_values, and PV match the expected length
        n_subexpressions = len(v_values)
        if len(h_values) != n_subexpressions or len(PV) != n_subexpressions:
            return jsonify({'error': 'Invalid input: v_values, h_values, and PV must have the same length'}), 400

        # Set up the optimization
        x0 = np.ones(4 * n_subexpressions) / \
    (4 * n_subexpressions)  # Initial guess for all xi
        bounds = [(0, None) for _ in range(4 * n_subexpressions)]
        constraint_dict = {'type': 'ineq', 'fun': constraint}

        # Perform the optimization
        result = minimize(objective, x0, args=tuple(v_values + h_values),
                          constraints=constraint_dict, bounds=bounds)

        # Extract the optimized solution
        x_opt = result.x

        # Extract relevant values and format them
        index = 0
        results = []
        for i in range(0, len(x_opt), 4):
            delta_bat_power = x_opt[i] - x_opt[i+1]
            delta_hydr = x_opt[i+2] - x_opt[i+3]
            pv_value = PV[index] - delta_bat_power - x_opt[i+2]
            index = index + 1

            formatted_delta_bat_power = "{:.0f}".format(delta_bat_power)
            formatted_pv_value = "{:.0f}".format(pv_value)
            formatted_delta_hydr = "{:.0f}".format(delta_hydr)

            results.append({
                'delta_bat_power': formatted_delta_bat_power,
                'EnergySold': formatted_pv_value,
                'delta_hydr': formatted_delta_hydr
            })

        return jsonify({'results': results, 'objective_value': -result.fun})

    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)