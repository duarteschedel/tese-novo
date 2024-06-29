import numpy as np
from scipy.optimize import minimize
from flask import Flask, jsonify, request
from flask_cors import CORS

# Define api

app = Flask(__name__)
CORS(app)


# Define the objective function to be maximized


def objective(x, *args):
    n = len(args) // 2
    PV = request.get_json().get('PV', [])
    q_values = request.get_json().get('q_values', [])
    eta_bat_ch = request.get_json().get('eta_bat_ch')
    eta_bat_dis = request.get_json().get('eta_bat_dis')
    eta_hydr = request.get_json().get('eta_hydr')

    if len(x) != 4 * n:
        raise ValueError(
            "The number of variables (xi) must be 4 times the number of subexpressions.")

    result = 0

    for i in range(n):
        vi = args[i]     # Get the v value for the i-th subexpression
        hi = args[i + n ]  # Get the h value for the i-th subexpression

        # if x[4*i] > 1:
        #     x[4*i+1] = 0  # Set x[4*i+1] to 0 if x[4*i] > 0
        # if x[4*i+1] > 1:
        #     x[4*i] = 0  # Set x[4*i+1] to 0 if x[4*i] > 0

        subexpression = (PV[i] - x[4*i] + (x[4*i+1] * eta_bat_dis) -
                         x[4*i+2] - q_values[i]) * vi + (x[4*i+3]) * hi
        result += subexpression

    return -result  # Negate the result to convert maximization to minimization

# Define the constraint function



def constraint(x):
    # n = len(x) // n_subexpressions
    constraints_list = []
    PV = request.get_json().get('PV', [])
    p_max_bat = request.get_json().get('p_max_bat')
    p_max_hydr = request.get_json().get('p_max_hydr')
    q_values = request.get_json().get('q_values', [])
    eta_hydr = request.get_json().get('eta_hydr')
    eta_bat_ch = request.get_json().get('eta_bat_ch')
    eta_bat_dis = request.get_json().get('eta_bat_dis')
    

    p_max_dis_bat = request.get_json().get('p_max_dis_bat')
    p_max_chg_bat = request.get_json().get('p_max_chg_bat')
    p_max_dis_hydr = request.get_json().get('p_max_dis_hydr')
    p_max_chg_hydr = request.get_json().get('p_max_chg_hydr')


    n_subexpressions = len(PV)
    # xn > 0
    for i in range(len(x)):
        constraints_list.append(x[i])


    # for i in range(n_subexpressions):
    #     expression = PV[i] - x[i*4] + \
    #         (x[i*4+1]*eta_bat_dis) - x[i*4+2] + x[i*4 + 4] - q_values[i]
    #     constraints_list.append(expression)

        

    # Certificar que P_dis <= P_max_dis_bat que P_dis é a energia maxima que posso tirar da bateria numa hora
    for i in range(n_subexpressions):
        expression = p_max_dis_bat - x[i*4+1]
        constraints_list.append(expression)
    # Certificar que P_ch <= P_max_ch_bat que P_ch é a energia maxima que posso carregar na bateria numa hora
    for i in range(n_subexpressions):
        expression = p_max_chg_bat - x[i*4]
        constraints_list.append(expression)
    # Certificar que P_dis_hydr <= P_max_dis_hydr que P_dis é a energia maxima que posso tirar da bateria numa hora
    for i in range(n_subexpressions):
        expression = p_max_dis_hydr - x[i*4+3]
        constraints_list.append(expression)
    # Certificar que P_ch_hyd <= P_max_ch_hydr que P_ch é a energia maxima que posso carregar na bateria numa hora
    for i in range(n_subexpressions):
        expression = p_max_chg_hydr - x[i*4+2]
        constraints_list.append(expression)
    
    # (x1 - x0) + (x4 - x4) + Pmax > 0 | (Pch0 - Pdis0) + (Pch1 - Pdis1) < Pmax | Certificar que o Pch é menor que a P-max que se pode armazenar de energia na bateria
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + (x[j*4+1] )-(x[j*4]*eta_bat_ch)
        expression = expression + p_max_bat
        constraints_list.append(expression)
    
    # (x0 - x1) + (x4 - x4) > 0 | (Pch0 - Pdis0) + (Pch1 - Pdis1) > 0 | Certificar que nao se vende mais energia do que aquele que sem tem
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + (x[j*4]* eta_bat_ch)-(x[j*4+1])
        constraints_list.append(expression)
    
    # (x3 - x2) + (x7 - x6) + Pmax_el > 0 | (Pch0_el - Pdis0_el) + (Pch1_el - Pdis1_el) < Pmax_el | Certificar que o Pch_el é menor que a P-max que se pode armazenar de Hydrogen
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + x[j*4+3]-(x[j*4+2]*eta_hydr)
        expression = expression + p_max_hydr
        constraints_list.append(expression)
    
    # (x2 - x3) + (x6 - x7) > 0 | (Pch0_el - Pdis0_el) + (Pch1_el - Pdis1_el) > 0 | Certificar que nao se vende mais hydrogen do que aquele que sem tem
    for i in range(n_subexpressions):
        expression = 0
        for j in range(i+1):
            expression = expression + (x[j*4+2]*eta_hydr)-x[j*4+3]
        constraints_list.append(expression)

    # Delta charge + Delta charge hydrogen < PV + P_pur  Certificar que a energia que se armazena na bateria e no hydrogen é menor que a energia que se tem disponivel
    # for i in range(n_subexpressions):
    #     expression = PV[i] + x[i*4+4] - x[i*4] - x[i*4+2]
    #     constraints_list.append(expression)
    

    constraints = np.array(constraints_list)

    return constraints  # Add xn > 0 and other constraints





@app.route('/optimize', methods=['POST'])
def optimize():
    try:
        data = request.get_json()

        # Extract v_values, h_values, and PV from the request data
        v_values = data.get('v_values', [])
        h_values = data.get('h_values', [])
        q_values = data.get('q_values', []) #informação da carga
        eta_bat_ch = data.get('eta_bat_ch')
        eta_bat_dis = data.get('eta_bat_dis')
        eta_hydr = data.get('eta_hydr')
        PV = data.get('PV', [])
        n_subexpressions = len(PV)

        # Ensure the lengths of v_values, h_values, and PV match the expected length
        n_subexpressions = len(v_values)
        if len(h_values) != n_subexpressions or len(PV) != n_subexpressions or len(q_values) != n_subexpressions:
            return jsonify({'error': 'Invalid input: v_values, h_values, q_values and PV must have the same length'}), 400

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

        print(x_opt)

        # Extract relevant values and format them
        index = 0
        results = []

        
        energy_in_battery = 0
        hydrogen_in_storage = 0


        for i in range(0, len(x_opt), 4):
            energy_in_battery = energy_in_battery + (x_opt[i]*eta_bat_ch) - x_opt[i+1]
            hydrogen_in_storage = hydrogen_in_storage + (x_opt[i+2]*eta_hydr) - x_opt[i+3]
            delta_bat_power = (x_opt[i]) - (x_opt[i+1])
            hydr_produced = x_opt[i+2] * eta_hydr
            hydr_value = x_opt[i+3]
            pv_value = PV[index] - (x_opt[i]) + (x_opt[i+1]*eta_bat_dis) - x_opt[i+2]  - q_values[index]
            # energy_bought = x_opt[i+4] 
            energy_bought = 0

            if pv_value < 0:
                energy_bought = -pv_value
                pv_value = 0       

            formatted_energy_in_battery = "{:.2f}".format(energy_in_battery)
            formatted_delta_bat_power = "{:.2f}".format(delta_bat_power)
            formatted_pv_value = "{:.2f}".format(pv_value)
            formatted_hydr_value = "{:.2f}".format(hydr_value)
            formatted_hydr_produced = "{:.2f}".format(hydr_produced)
            formatted_energy_bought = "{:.2f}".format(energy_bought)
            formatted_hydrogen_in_storage = "{:.2f}".format(hydrogen_in_storage)

            

            index = index + 1
            
            results.append({
                'Delta Battery Energy': formatted_delta_bat_power,
                'Energy Sold': formatted_pv_value,
                'Hydrogen Produced': formatted_hydr_produced,
                'Hydrogen Sold': formatted_hydr_value,
                'Energy Bougth': formatted_energy_bought,
                'Energy In Battery': formatted_energy_in_battery,
                'Hydrogen In Storage': formatted_hydrogen_in_storage,
                
            })
        
        return jsonify({'results': results, 'objective_value': -result.fun})

    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)